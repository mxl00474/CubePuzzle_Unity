#pragma strict

import System.Collections.Generic;

/**
*********************************************
 Member definitions
*********************************************
**/
// Rotation Target
var targetObject : GameObject;
var cameraPivot : GameObject;
var mainCamera : GameObject;
var menuW : GameObject;
var inquiryW : GameObject;
var lockB : GameObject;

var debugFlag : boolean;

private var rotatetarget : Transform;
private var targetCube : Transform;

// Tap point (on the screen world)
var tapPoint : Vector3;

// Rotate speed
var rotateSpeed : float;
var cameraRotateSpeed : float;
var cameraZoomSpeed : float;

// Raycast SetUp:
var hit : RaycastHit;

// Axis of the panels
private var up : Vector3;
private var axis1 : Vector3;
private var axis2 : Vector3;

private var targetAxis : Vector3;

// For Cube rotation
private var sign : float;
private var rotateAmount : float;

// Axis for the camera
private var camera_up : Vector3;
private var camera_right : Vector3;
private var camera_forward : Vector3;

private var isTouchOnPlane : boolean; // True when touch on the planes
private var isRotateByDrag : boolean;
private var isRotation : boolean; // True during the roration
private var isLocked : boolean;	// True when cubes are locked

// Cubes
private var cubes : GameObject[];
private var cube_positions : List.<Vector3>;

// Stack to save the operation history
private var stack : Stack;

// GUI
private var isMenuActive : boolean;

/**
*********************************************
 Start functions
*********************************************
**/

function Start () {	

	//Initialize the boolean flags
	isRotation = false;
	isRotateByDrag = false;
	isMenuActive = false;
	isLocked = false;

	// Put all cube to cubes
	if (cubes == null)
		cubes = GameObject.FindGameObjectsWithTag ("Cube");

	// Store the positions for all cubes
	cube_positions = new List.<Vector3>();
	for (var i = 0 ; i < cubes.Length ; i++)
		cube_positions.Add(cubes[i].transform.position);

	// Initialize the stack
	stack = new Stack();
	
	// Hide Menu Window
	menuW.SetActive(isMenuActive);
	inquiryW.SetActive(false);
}

function OnEnable(){
	IT_Gesture.onDraggingStartE += OnDraggingStart; // Drag start
	IT_Gesture.onDraggingE += OnDragging; // Drag
	IT_Gesture.onDraggingEndE += OnDraggingEnd; // Drag end
	IT_Gesture.onRotateE += OnRotate; // Rotate
	IT_Gesture.onPinchE += OnPinch; // Pinch
	IT_Gesture.onSwipeE += OnSwipe; // Swipe
	IT_Gesture.onTouchPosE += OnOn; // Tap
}

function OnDisable(){
	IT_Gesture.onDraggingStartE -= OnDraggingStart;
	IT_Gesture.onDraggingE -= OnDragging;
	IT_Gesture.onDraggingEndE -= OnDraggingEnd;
	IT_Gesture.onRotateE -= OnRotate;
	IT_Gesture.onPinchE -= OnPinch;
	IT_Gesture.onSwipeE -= OnSwipe;
	IT_Gesture.onTouchPosE -= OnOn;
}

/**
*********************************************
 Update
*********************************************
**/

function Update () {

	// Execute rotation
	if (isRotation) {
		exeRotate(rotateSpeed);
	}
	
	// Menu key and back key
	if (Application.platform == RuntimePlatform.Android){
		if (Input.GetKeyUp(KeyCode.Escape)){			
			if (isMenuActive){ // If menu is active, close the menu
				isMenuActive = false;
				menuW.SetActive(isMenuActive);
			} else { // close the application
				displayInquiry();
			}
		}
	}
}

/**
*********************************************
 Helper functions
*********************************************
**/

/**
Adjust position vector to the nearest integer
**/
function adjustPositionVector(v : Vector3){
	var res : Vector3;
	res.x = Mathf.RoundToInt(v.x/0.5) * 0.5;
	res.y = Mathf.RoundToInt(v.y/0.5) * 0.5;
	res.z = Mathf.RoundToInt(v.z/0.5) * 0.5;
	return res;
}

/**
Adjust angle vector to the nearest multiple of 90
**/
function adjustAngleVector(v : Vector3){
	var res : Vector3;
	res.x = Mathf.RoundToInt(v.x/90.0) * 90;
	res.y = Mathf.RoundToInt(v.y/90.0) * 90;
	res.z = Mathf.RoundToInt(v.z/90.0) * 90;
	
	Debug.Log("original x=" + v.x + ", y=" + v.y + ", z=" + v.z);
	Debug.Log("adjusted x=" + res.x + ", y=" + res.y + ", z=" + res.z);
	return res;
}

/**
 Ajust all cube positions and angles
**/
function adjustAllCubes(){
	for (var c : GameObject in cubes){
		c.transform.position = adjustPositionVector(c.transform.position);
		c.transform.localEulerAngles = adjustAngleVector(c.transform.localEulerAngles);	
	}
	rotatetarget.position = adjustPositionVector(rotatetarget.position);
	rotatetarget.localEulerAngles = adjustAngleVector(rotatetarget.localEulerAngles);	
}

/**
 Execute rotation
**/
function exeRotate(speed : float){
	if (rotateAmount + speed > 90.0){
		rotatetarget.Rotate(targetAxis, sign * (90.0 - rotateAmount), Space.World);
		isRotation = false;
		adjustAllCubes(); // Adjust the cube positions and angles
	} else {
		rotatetarget.Rotate(targetAxis, sign * speed, Space.World);
		rotateAmount += speed;
	}
	
}

/**
 Set a target object of the rotation
**/
function setTargetCube(){

	if (debugFlag) Debug.Log(hit.transform.name);

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
}

/**
 set a target axis and a sign of the rotation
**/
function setTargetAxis(diff:Vector3){
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

	if (debugFlag) 
		Debug.Log("Axsis: X=" + targetAxis.x + ", Y=" + targetAxis.y + ", Z=" + targetAxis.z 
				+ ", sign=" + sign + ", dot1=" + dot1 + ", dot2=" + dot2);
}	

/**
 Initialize rotation
**/
function initRotate(){

	// Create the target Object
	rotatetarget = targetObject.transform;
	rotatetarget.position = Vector3.zero;

	// Put the target cubes to the target Object
	var av : Vector3 = adjustPositionVector(targetAxis);
	var tv : Vector3 = adjustPositionVector(targetCube.position);
	var tx = tv.x * av.x;
	var ty = tv.y * av.y;
	var tz = tv.z * av.z;

	if (debugFlag) Debug.Log("TX=" + tx + ",TY=" + ty + ",TZ=" + tz);

	for (var c : GameObject in cubes){

		var cv : Vector3 = adjustPositionVector(c.transform.position);
		var x = cv.x * av.x;
		var y = cv.y * av.y;
		var z = cv.z * av.z;

		if (debugFlag) Debug.Log("X=" + x + ",Y=" + y + ",Z=" + z);

		if (x == tx && y == ty && z == tz)
			c.transform.parent = targetObject.transform;
		else
			c.transform.parent = null;
	}
	
	// set RotateAmount to 0
	rotateAmount = 0.0;
}

/**
Push the rotate info to the stack
**/
function pushRotateInfo(_cube : String, _axis : Vector3, _sign : float) {

	var rotateInfo : MyRotateInfo = new MyRotateInfo(_sign, _cube, _axis);

	//rotateInfo.Cube = _cube;
	//rotateInfo.Sign = _sign;
	//rotateInfo.Axis = _axis;
	
	stack.Push(rotateInfo);
}

/**
Pop the rotate info from the stack
**/
function popRotateInfo(){
	if (stack.Count == 0) {
		return null;
	} else {
		var rotateInfo : MyRotateInfo = stack.Pop();
		return rotateInfo;
	}
}

/**
Revert rotation
**/
function revertRotate(){
	var rotateInfo : MyRotateInfo = popRotateInfo();
	
	// If the stack is empty, do nothing.
	if (rotateInfo == null) return;
	
	var cubeName : String = rotateInfo.Cube;
	targetAxis = rotateInfo.Axis;
	sign = rotateInfo.Sign * -1.0;
	
	if (cubeName == "all") {
		initRotateAllCubes();
		isRotation = true; // Start the rotation imidiately.
	}
	else {
		targetCube = findCubeByName(cubeName);	
		if (targetCube == null) return;
		initRotate();
		isRotation = true; // Start the rotation imidiately.
	}
	
	exeRotate(rotateSpeed);
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
RotateAllHelper
**/
function rotateAllHelper(){
	pushRotateInfo("all", targetAxis, sign);
	initRotateAllCubes();
	isRotation = true; // Start the rotation imidiately.
	exeRotate(rotateSpeed);
}

/**
Select all cubes
**/
function initRotateAllCubes(){

	// Create the target Object
	rotatetarget = targetObject.transform;
	rotatetarget.position = Vector3.zero;
	
	// Put all cubes to the rotate target
	for (var c : GameObject in cubes){
		c.transform.parent = targetObject.transform;
	}
	
	rotateAmount = 0.0;
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
}

/**
Reset cubes to the original ImagePosition
**/
function resetCube(){
	//Change the direction of all cubes
	//for (var c : GameObject in cubes){
	//	c.transform.rotation = Quaternion.LookRotation(Vector3.zero);
	//}
	
	for (var i = 0 ; i < cubes.Length ; i++){
		cubes[i].transform.parent = null;
		cubes[i].transform.rotation = Quaternion.LookRotation(Vector3.zero);
		cubes[i].transform.position = cube_positions[i];
	}
	
	//Clear rotate Stack
	stack.Clear();
}

/**
*********************************************
 GUI events
*********************************************
**/

/**
Click Revert
**/
function revert(){
	if (!isRotation){
		revertRotate();
	}
}

/**
Click Lock button
**/
function toggleLock(){
	isLocked = isLocked ? false : true;
}

/**
Click Right (Currently not used)
**/
function click_right(){
	if (!isRotation){
		targetAxis = Vector3.up;
		sign = -1;
		rotateAllHelper();
	}
}

/**
Click Left (Currently not used)
**/
function click_left(){
	if (!isRotation){
		targetAxis = Vector3.up;
		sign = 1;
		rotateAllHelper();
	}
}

/**
Click Up (Currently not used)
**/
function click_up(){
	if (!isRotation){
		targetAxis = Vector3.forward;
		sign = 1;
		rotateAllHelper();
	}
}

/**
Click Down (Currently not used)
**/
function click_down(){
	if (!isRotation){
		targetAxis = Vector3.forward;
		sign = -1;
		rotateAllHelper();
	}
}

/**
Toggle Menu Window
**/
function toggleMenu(){
	isMenuActive = isMenuActive ? false : true;
	menuW.SetActive(isMenuActive);
}

/**
Click rest button
**/
function click_reset(){
	// Reset all cubes
	resetCube();
	// close menu
	toggleMenu();
}

/**
Click shuffle button
**/
function click_shuffle(){
	// shuffle cubes
	shuffle();
	// close menu
	toggleMenu();
}

/**
Beck to the title scene (TODO)
**/
function displayInquiry(){
	inquiryW.SetActive(true);
}

function backToTitle(){
	Application.Quit();
}

function cancelInquiry(){
	inquiryW.SetActive(false);
}

/**
Save Status
**/
function saveStatus(){

	// Create tempory stack so that the entries are not removed
	var tmpStack : Stack = new Stack(stack);
	
	// Create the status object for the serialization
	var list : List.<MyRotateInfo> = new List.<MyRotateInfo>();
	while (tmpStack.Count > 0) {
		var info : MyRotateInfo = tmpStack.Pop();
		list.Add (info);
	}
	var status : Status = new Status("scene1", list, mainCamera.transform.position, cameraPivot.transform.eulerAngles);
	
	DataSerializer.WriteStatus(status);

	// close menu
	toggleMenu();
}

/**
Load status
**/
function loadStatus(){
	// Clear the stack and reset cubes once (TODO: Error check before start)
	stack.Clear();
	resetCube();
	
	// deserialize the status
	var status : Status = DataSerializer.ReadStatus();
	
	// restore the sequences
	var list : List.<MyRotateInfo> = status.list;
	for (var i= 0 ; i < list.Count ; i++){
		var info : MyRotateInfo = list[i];
		stack.Push(info);
		restoreRotation(info);
	}
	
	// Restore camera position and angle
	cameraPivot.transform.eulerAngles = new Vector3(status.camera_vx, status.camera_vy, status.camera_vz);
	mainCamera.transform.position = new Vector3(status.camera_x, status.camera_y, status.camera_z);
	
	// close menu
	toggleMenu();
}

/**
Restore rotaiton sequence
**/
function restoreRotation(rotateInfo : MyRotateInfo){
	var cubeName : String = rotateInfo.Cube;
	targetAxis = rotateInfo.Axis;
	sign = rotateInfo.Sign;
	
	if (cubeName == "all") {
		initRotateAllCubes();
		isRotation = true; // Start the rotation imidiately.
	}
	else {
		targetCube = findCubeByName(cubeName);	
		if (targetCube == null) return;
		initRotate();
		isRotation = true; // Start the rotation imidiately.
	}	

	rotatetarget.Rotate(targetAxis, sign * 90, Space.World);
	isRotation = false;
}

/**
*********************************************
 Touch events
*********************************************
**/

function OnOn(pos:Vector2){

	if (debugFlag) Debug.Log("Tap");

	// Prepare for change the angle
	camera_up = cameraPivot.transform.up;
	camera_right = cameraPivot.transform.right;
	camera_forward = cameraPivot.transform.forward;
}

function OnDraggingStart(dragInfo:DragInfo){

	if (debugFlag) Debug.Log("Drag Start");

	tapPoint = dragInfo.pos;

	// In the future, if the rotation by drag is supported, uncomment these lines		
	//var ray = Camera.main.ScreenPointToRay (tapPoint);
	//if (Physics.Raycast (ray, hit) && hit.transform.tag == "Plane" 
	//	&& !isRotation && !isMenuActive && !isLocked) { // prepare for moving cubes
	//
	//	setTargetCube();
	//	setTargetAxis(dragInfo.delta);
	//	
	//	initRotate();
	//	
	//	isRotateByDrag = true;
	//}
}

function OnDraggingEnd(dragInfo:DragInfo){

	if (debugFlag) Debug.Log("Drag End");

	// In the future, if the rotation by drag is supported, uncomment these lines		
	//if (isRotateByDrag) {
	//
	//	isRotateByDrag = false;
	//	isRotation = true;		
	//	// Push the rotation info
	//	var cubeProperty : CubeProperty = targetCube.GetComponent("CubeProperty");
	//	pushRotateInfo(cubeProperty.CubeName, targetAxis, sign);
	//			
	//}
}

function OnDragging(dragInfo:DragInfo){

	if (debugFlag) Debug.Log("dragging");

	var ray = Camera.main.ScreenPointToRay (tapPoint);
	
	//if (dragInfo.fingerCount == 1 && isLocked){
	if (isLocked || !Physics.Raycast (ray, hit)) {

		// Execute rotation
		var cdx : float = dragInfo.delta.x;
		var cdy : float = dragInfo.delta.y;	
		cameraPivot.transform.Rotate(camera_up, cdx * cameraRotateSpeed, Space.World);
		cameraPivot.transform.Rotate(camera_right, cdy * cameraRotateSpeed, Space.World);
	}
	
	// In the future, if the rotation by drag is supported, uncomment these lines		
	/* TODO: Implement rotation by drag
	if (isRotateByDrag) {
		var speed : float = Mathf.Sqrt(Mathf.Pow(dragInfo.delta.x,2) + Mathf.Pow(dragInfo.delta.y,2));
		exeRotate(speed);
	}*/
}

function OnRotate(rinfo:RotateInfo){

	if (debugFlag) Debug.Log("Rotating");
	
	cameraPivot.transform.Rotate(camera_forward, -rinfo.magnitude * cameraRotateSpeed, Space.World);
}

function OnPinch(pinfo:PinchInfo){

	if (debugFlag) Debug.Log("Pinching");
	
	Debug.Log("magnitude = " + pinfo.magnitude);
	
	var zoomSpeed : float = Mathf.Clamp(1.0 + pinfo.magnitude*cameraZoomSpeed/IT_Gesture.GetDPIFactor(), 0.8, 1.2);
	var p : Vector3 = mainCamera.transform.position;	
	mainCamera.transform.position = p * zoomSpeed;
}

function OnSwipe(sw:SwipeInfo){

	if (debugFlag) Debug.Log("Swiping"); 
	
	var ray = Camera.main.ScreenPointToRay (sw.startPoint);
		
	if (Physics.Raycast (ray, hit) && hit.transform.tag == "Plane" && 
		!isRotation && !isMenuActive && !isLocked) { // Swipte on the plane
								
		if (debugFlag) Debug.Log(hit.transform.name);

		setTargetCube();
		setTargetAxis(sw.direction);

		// Push the rotation info
		var cubeProperty : CubeProperty = targetCube.GetComponent("CubeProperty");
		pushRotateInfo(cubeProperty.CubeName, targetAxis, sign);
		
		//Initialize rotation
		isRotation = true;
		initRotate();
	}
}
