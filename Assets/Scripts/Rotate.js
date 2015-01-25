#pragma strict

// Rotation Target
var targetObject : GameObject;
var cameraPivot : GameObject;

private var rotatetarget : Transform;
private var targetCube : Transform;

// Rotate speed
var rotateSpeed : float;
var rotateCount : int;

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
private var cube : GameObject;
private var cubes;

function Start () {
	//Initialize the boolean flags
	isTouchOnPlane = false;
	isRotation = false;
	isDragStart = false;

	// Put all cube to cubes
	if (cubes == null)
		cubes = GameObject.FindGameObjectsWithTag ("Cube");		
}

function Update () {

	if (isRotation) { //Execute rotation
		exeRotate();

	} else { // Handles touch / click

		var ray = Camera.main.ScreenPointToRay (Input.mousePosition);

		// Mouse / touch down
		if(Input.GetMouseButtonDown(0)) {
		//if(Input.GetTouch(0).phase == TouchPhase.Began) {					

			if (Physics.Raycast (ray, hit) && hit.transform.tag == "Plane") { // Flick start when touch the planes			
								
				isTouchOnPlane = true;
				Debug.Log(hit.transform.name);

				// Store the mouse position
				sx = Input.mousePosition.x;
				sy = Input.mousePosition.y;
				
				// Up, axis1, axis2 of the panel (in world space)
				up = hit.transform.up;
				axis1 = hit.transform.forward;
				axis2 = hit.transform.right;

				// Set the target Cube
				targetCube = hit.transform.parent;
				
			} else if(!Physics.Raycast (ray, hit) && !isDragStart) { // Start drag when touching nothing
				
				isDragStart	= true;
				
				camera_up = cameraPivot.transform.up;
				camera_right = cameraPivot.transform.right;				
				camera_x = Input.mousePosition.x;
				camera_y = Input.mousePosition.y;
			}
		}

		//flick End
		if(Input.GetMouseButtonUp(0) && isTouchOnPlane	) {
		//if(Input.GetTouch(0).phase == TouchPhase.Ended) {

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

			//Debug.Log("Axsis: X=" + targetAxis.x + ", Y=" + targetAxis.y + ", Z=" + targetAxis.z 
			//			+ ", sign=" + sign + ", dot1=" + dot1 + ", dot2=" + dot2);

			isTouchOnPlane = false;
			initRotate();
		}

		//Drag
		if(Input.GetMouseButton(0) && isDragStart) {
		
			// cdx and cdy are the difference from the previous mouse point
			var cdx : float = Input.mousePosition.x - camera_x;
			var cdy : float = Input.mousePosition.y - camera_y;

			// Reserve the current mouse position for the next drag
			camera_x = Input.mousePosition.x;
			camera_y = Input.mousePosition.y;
			
			// Execute rotation
			cameraPivot.transform.Rotate(camera_up, cdx, Space.World);
			cameraPivot.transform.Rotate(camera_right, cdy, Space.World);

		}
		
		//Drag end
		if (Input.GetMouseButtonUp(0) && isDragStart){
			isDragStart = false;
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

	Debug.Log("TX=" + tx + ",TY=" + ty + ",TZ=" + tz);

	for (var c : GameObject in cubes){

		var cv : Vector3 = adjustPosition(c.transform.position);
		var x = cv.x * av.x;
		var y = cv.y * av.y;
		var z = cv.z * av.z;

		Debug.Log("X=" + x + ",Y=" + y + ",Z=" + z);

		if (x == tx && y == ty && z == tz)
			c.transform.parent = targetObject.transform;
		else
			c.transform.parent = null;
	}
}
