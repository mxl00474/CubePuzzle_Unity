#pragma strict

import System.Collections.Generic;

// Rotation Target
var targetObject : GameObject;
var cameraPivot : GameObject;
var menuW : GameObject;
var debugFlag : boolean;

private var rotatetarget : Transform;
private var targetCube : Transform;

// Rotate speed
var rotateSpeed : float;
var rotateCount : int;
var cameraRotateSpeed : float;

// Raycast SetUp:
var hit : RaycastHit;

// Axis of the panels
private var up : Vector3;
private var axis1 : Vector3;
private var axis2 : Vector3;

private var targetAxis : Vector3;

// Mouse position in origin (click)
private var sx:float;
private var sy:float;

// For Cube rotation
private var rotateCounter : int;
private var sign : float;

// Axis for the camera
private var camera_up : Vector3;
private var camera_right : Vector3;
private var camera_x : float;
private var camera_y : float;

private var isTouchOnPlane : boolean; // True when touch on the planes
private var isRotation : boolean; // True during the roration
private var isDragStart : boolean; // True when starting drug

// Cubes
private var cubes : GameObject[];

// Stack to save the operation history
private var stack : Stack;

// GUI
private var isMinimize : boolean;
private var isMenuActive : boolean;

function Start () {	

	//Initialize the boolean flags
	isTouchOnPlane = false;
	isRotation = false;
	isDragStart = false;
	isMinimize = false;	
	isMenuActive = false;

	// Put all cube to cubes
	if (cubes == null)
		cubes = GameObject.FindGameObjectsWithTag ("Cube");
	
	// Initialize the stack
	stack = new Stack();
	
	// Hide Menu Window
	menuW.SetActive(isMenuActive);
}

function Update () {

	if (isRotation) { //Execute rotation
		exeRotate();

	} else { // Handles touch / click

		var ray = Camera.main.ScreenPointToRay (Input.mousePosition);

		// Mouse / touch down
		if ((debugFlag && Input.GetMouseButtonDown(0)) ||
			 (!debugFlag && Input.GetTouch(0).phase == TouchPhase.Began)) {

			if (Physics.Raycast (ray, hit) && hit.transform.tag == "Plane" && !isMenuActive) { // Flick start when touch the planes			
								
				isTouchOnPlane = true;
				if (debugFlag) Debug.Log(hit.transform.name);

				// Store the mouse position
				sx = Input.mousePosition.x;
				sy = Input.mousePosition.y;
				
				// Up, axis1, axis2 of the panel (in world space)
				up = hit.transform.up;
				axis1 = hit.transform.forward;
				axis2 = hit.transform.right;

				// Set the target Cube
				targetCube = hit.transform.parent;
				
				if (debugFlag) {
					var test : CubeProperty = targetCube.GetComponent("CubeProperty");
					Debug.Log("cubeName=" + test.CubeName);
				}
				
			} else if(!Physics.Raycast (ray, hit) && !isDragStart) { // Start drag when touching nothing
				
				isDragStart	= true;
				if (debugFlag) Debug.Log("Drag start");
				
				camera_up = cameraPivot.transform.up;
				camera_right = cameraPivot.transform.right;				
				camera_x = Input.mousePosition.x;
				camera_y = Input.mousePosition.y;
			}
		}

		//flick End
		if((debugFlag && Input.GetMouseButtonUp(0) && isTouchOnPlane) || 
			(!debugFlag && Input.GetTouch(0).phase == TouchPhase.Ended && isTouchOnPlane)) {

			// Mouse move vector (in screen space)
			var dx : float = Input.mousePosition.x - sx;
			var dy : float = Input.mousePosition.y - sy;
			var diff : Vector2 = Vector2(dx, dy).normalized;

			// transform axis1 and axis2 to screen space
			var axis1S : Vector3 = Camera.main.WorldToScreenPoint(axis1);
	 		var axis2S : Vector3 = Camera.main.WorldToScreenPoint(axis2);
	 		var origin : Vector3 = Camera.main.WorldToScreenPoint(Vector3.zero);
			var axis1SS : Vector2 = Vector2(axis1S.x - origin.x, axis1S.y - origin.y).normalized;
			var axis2SS : Vector2 = Vector2(axis2S.x - origin.x, axis2S.y - origin.y).normalized;

			// Judge the direction to rotate by comparing the inner-product
			var dot1 : float = Vector2.Dot(diff, axis1SS);
			var dot2 : float = Vector2.Dot(diff, axis2SS);

			if (Mathf.Abs(dot1) < Mathf.Abs(dot2)){
				targetAxis = axis1;
				sign = Mathf.Sign(dot2) * -1.0;
			} else {
				targetAxis = axis2;
				sign = Mathf.Sign(dot1);
			}

			// Push the rotation info
			var cubeProperty : CubeProperty = targetCube.GetComponent("CubeProperty");
			pushRotateInfo(cubeProperty.CubeName, targetAxis, sign);

			if (debugFlag) 
				Debug.Log("Axsis: X=" + targetAxis.x + ", Y=" + targetAxis.y + ", Z=" + targetAxis.z 
						+ ", sign=" + sign + ", dot1=" + dot1 + ", dot2=" + dot2);

			isTouchOnPlane = false;
			
			//Initialize rotation
			initRotate();			
		}

		//Drag
		if((debugFlag && Input.GetMouseButton(0) && isDragStart) ||
			(!debugFlag && Input.GetTouch(0).phase == TouchPhase.Moved && isDragStart)){
		
			if (debugFlag) Debug.Log("Dragging");
			
			// cdx and cdy are the difference from the previous mouse point
			var cdx : float = Input.mousePosition.x - camera_x;
			var cdy : float = Input.mousePosition.y - camera_y;

			// Reserve the current mouse position for the next drag
			camera_x = Input.mousePosition.x;
			camera_y = Input.mousePosition.y;
			
			// Execute rotation
			cameraPivot.transform.Rotate(camera_up, cdx * cameraRotateSpeed, Space.World);
			cameraPivot.transform.Rotate(camera_right, cdy * cameraRotateSpeed, Space.World);

		}
		
		//Drag end
		if ((debugFlag && Input.GetMouseButtonUp(0) && isDragStart) ||
			(!debugFlag && Input.GetTouch(0).phase == TouchPhase.Ended)){
			isDragStart = false;
			if (debugFlag) Debug.Log("Drag end");
		}
	}
}

// Adjust the axis vector because sometimes it is not exactly 0
function adjustAxisVector(v : Vector3){
	var res : Vector3;
	res.x = Mathf.Abs(v.x) > 0.5 ? 1 : 0;
	res.y = Mathf.Abs(v.y) > 0.5 ? 1 : 0;
	res.z = Mathf.Abs(v.z) > 0.5 ? 1 : 0;
	return res;
}

// Adjust positions
function adjustPosition(v : Vector3){
	var res : Vector3;

	if (v.x < -0.05)
		res.x = -1;
	else if (v.x > 0.05)
		res.x = 1;
	else
		res.x = 0;

	if (v.y < -0.05)
		res.y = -1;
	else if (v.y > 0.05)
		res.y = 1;
	else
		res.y = 0;

	if (v.z < -0.05)
		res.z = -1;
	else if (v.z > 0.05)
		res.z = 1;
	else
		res.z = 0;

	return res;
}
/**
 Execute rotation
**/
function exeRotate(){
	if (rotateCounter == rotateCount){
		isRotation = false;
	} else {
		rotatetarget.Rotate(targetAxis, sign * rotateSpeed, Space.World);
		rotateCounter ++;
	}
}

/**
 Initialize rotation
**/
function initRotate(){
	// Change the status to isRotation
	isRotation = true;
	rotateCounter = 0;

	// Create the target Object
	rotatetarget = targetObject.transform;
	rotatetarget.position = Vector3.zero;

	// Put the target cubes to the target Object
	var av : Vector3 = adjustAxisVector(targetAxis);
	var tv : Vector3 = adjustPosition(targetCube.position);
	var tx = tv.x * av.x;
	var ty = tv.y * av.y;
	var tz = tv.z * av.z;

	if (debugFlag) Debug.Log("TX=" + tx + ",TY=" + ty + ",TZ=" + tz);

	for (var c : GameObject in cubes){

		var cv : Vector3 = adjustPosition(c.transform.position);
		var x = cv.x * av.x;
		var y = cv.y * av.y;
		var z = cv.z * av.z;

		if (debugFlag) Debug.Log("X=" + x + ",Y=" + y + ",Z=" + z);

		if (x == tx && y == ty && z == tz)
			c.transform.parent = targetObject.transform;
		else
			c.transform.parent = null;
	}
}

/**
Push the rotate info to the stack
**/
function pushRotateInfo(_cube : String, _axis : Vector3, _sign : float) {

	var rotateInfo : RotateInfo = new RotateInfo();

	rotateInfo.cube = _cube;
	rotateInfo.sign = _sign;
	rotateInfo.axis = _axis;
	
	stack.Push(rotateInfo);
}

/**
Pop the rotate info from the stack
**/
function popRotateInfo(){
	if (stack.Count == 0) {
		return null;
	} else {
		var rotateInfo : RotateInfo = stack.Pop();
		return rotateInfo;
	}
}

/**
Revert rotation
**/
function revertRotate(){
	var rotateInfo : RotateInfo = popRotateInfo();
	
	// If the stack is empty, do nothing.
	if (rotateInfo == null) return;
	
	var cubeName : String = rotateInfo.cube;
	targetAxis = rotateInfo.axis;
	sign = rotateInfo.sign * -1.0;
	
	if (cubeName == "all") {
		initRotateAllCubes();
	}
	else {
		targetCube = findCubeByName(cubeName);	
		if (targetCube == null) return;
		initRotate();
	}
	
	exeRotate();
}

/**
 Find cube by name
**/
function findCubeByName(_name : String) {
	for (var c : GameObject in cubes){
		var cubeProperty : CubeProperty = c.GetComponent("CubeProperty");
		if (cubeProperty.CubeName == _name)
			return c.transform;
	}
	return null;
}

/**
Click Revert
**/
function revert(){
	if (!isRotation){
		revertRotate();
		isDragStart = false;
	}
}

/**
Click Right
**/
function click_right(){
	if (!isRotation){
		targetAxis = Vector3.up;
		sign = -1;
		rotateAllHelper();
	}
}

/**
Click Left
**/
function click_left(){
	if (!isRotation){
		targetAxis = Vector3.up;
		sign = 1;
		rotateAllHelper();
	}
}

/**
Click Up
**/
function click_up(){
	if (!isRotation){
		targetAxis = Vector3.forward;
		sign = 1;
		rotateAllHelper();
	}
}

/**
Click Down
**/
function click_down(){
	if (!isRotation){
		targetAxis = Vector3.forward;
		sign = -1;
		rotateAllHelper();
	}
}


/**
RotateAllHelper
**/
function rotateAllHelper(){
	pushRotateInfo("all", targetAxis, sign);
	initRotateAllCubes();
	exeRotate();
	isDragStart = false;
}

/**
Toggle Menu Window
**/
function toggleMenu(){
	isMenuActive = isMenuActive ? false : true;
	menuW.SetActive(isMenuActive);
}

/**
Select all cubes
**/
function initRotateAllCubes(){
	// Initialize rotate
	isRotation = true;
	rotateCounter = 0;

	// Create the target Object
	rotatetarget = targetObject.transform;
	rotatetarget.position = Vector3.zero;
	
	// Put all cubes to the rotate target
	for (var c : GameObject in cubes){
		c.transform.parent = targetObject.transform;
	}
}

/**
Shuffle cubes
**/
function shuffle () {

	for (var i : int = 0 ; i < 10 ; i++){
		var num : int = Random.value * cubes.Length;	
		targetCube = cubes[num].transform;
		
		var r : float = Random.value;
		if (r > 0.66)
			targetAxis = Vector3.right;
		else if (r > 0.33)
			targetAxis = Vector3.forward;
		else
			targetAxis = Vector3.up;
		
		sign = Random.value > 0.5 ? 1 : -1;
		
		// Push the rotation info
		var cubeProperty : CubeProperty = targetCube.GetComponent("CubeProperty");
		pushRotateInfo(cubeProperty.CubeName, targetAxis, sign);

		// Execute rotation
		initRotate();
		rotatetarget.Rotate(targetAxis, sign * 90, Space.World);
		isRotation = false;
	}
	
	isDragStart = false;
}

/**
Reset cubes to the original ImagePosition
**/
function resetCube(){
	//Change the direction of all cubes
	for (var c : GameObject in cubes){
		c.transform.rotation = Quaternion.LookRotation(Vector3.zero);
	}
	
	//Clear rotate Stack
	stack.Clear();
}





