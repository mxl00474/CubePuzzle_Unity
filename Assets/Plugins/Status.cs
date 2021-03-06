﻿using UnityEngine;
using System.Collections.Generic;

// Status to be saved
public class Status {
	// Scene name
	public string scene;

	// Rotation history
	public List<MyRotateInfo> list = new List<MyRotateInfo>();

	// Camera positions and angle
	public float camera_x = 0.0f;
	public float camera_y = -1.0f;
	public float camera_z = 7.0f;

	public float camera_vx = 320.0f;
	public float camera_vy = 45.0f;
	public float camera_vz = 0;
	
	public Status(){
	}
	
	public Status(string scene, List<MyRotateInfo> list, Vector3 camera_position, Vector3 camera_angle){
		this.scene = scene;
		this.list = list;

		this.camera_x = camera_position.x;
		this.camera_y = camera_position.y;
		this.camera_z = camera_position.z;

		this.camera_vx = camera_angle.x;
		this.camera_vy = camera_angle.y;
		this.camera_vz = camera_angle.z;
	}
}
