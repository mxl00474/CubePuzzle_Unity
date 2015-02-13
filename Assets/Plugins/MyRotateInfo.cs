using UnityEngine;
using System.Collections;

public class MyRotateInfo {

	// Sign of the rotation
	private int sign;
	// target cube name
	private string cubeName;
	//Vector for Axis
	private float axis_x;
	private float axis_y;
	private float axis_z;

	// Property accessor
	public int Sign { 
		get { return this.sign;}
		set { this.sign = value; }
	}
	public string Cube { 
		get { return this.cubeName;}
		set { this.cubeName = value; }
	}
	public Vector3 Axis { 
		get { return new Vector3(axis_x, axis_y, axis_z);}
		/*set {
			this.axis_x = value.x;
			this.axis_y = value.y;
			this.axis_z = value.z;
		}*/
	}
	public float x {
		get { return axis_x;}
		set { axis_x = value;}
	}
	public float y {
		get { return axis_y;}
		set { axis_y = value;}
	}
	public float z {
		get { return axis_z;}
		set { axis_z = value;}
	}

	// Default constructor
	public MyRotateInfo(){
	}
	
	public MyRotateInfo(int sign, string cubeName, Vector3 v){
		this.sign = sign;
		this.cubeName = cubeName;
		this.axis_x = v.x;
		this.axis_y = v.y;
		this.axis_z = v.z;
	}
}
