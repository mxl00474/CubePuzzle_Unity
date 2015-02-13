using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using JsonFx;

public class DataSerializer : MonoBehaviour {

	static private string storagePath = Application.persistentDataPath + "/storage";
	
	static public void WriteStatus(Status s) {

		try {
			if (!Directory.Exists(storagePath)) 
			{ 
				Directory.CreateDirectory(storagePath); 
			}

			string path = storagePath + "/game_status";
			Debug.Log (storagePath);

			string json = JsonFx.Json.JsonWriter.Serialize(s);
			File.WriteAllText(path, json, System.Text.Encoding.UTF8); 
		}
		catch (IOException e){
			//TODO
		}
	}
	
	static public Status ReadStatus() {
		try {
			string path = storagePath + "/game_status";
			string json = File.ReadAllText (path, System.Text.Encoding.UTF8);
			Status s = JsonFx.Json.JsonReader.Deserialize<Status> (json);
		
			Debug.Log (s.scene);

			foreach (MyRotateInfo info in s.list)
			{
				Debug.Log ("Sign=" + info.Sign);
				Debug.Log ("cubeName=" + info.Cube);
				Vector3 v = info.Axis;
				Debug.Log ("Loaded: X=" + v.x + ", Y=" + v.y + ", Z=" + v.z);
			}
			return s;
		}
		catch (IOException e){
			return null;
			//TODO
		}
	}
}
