using System.Collections.Generic;

// Status to be saved
public class Status {
	public string scene;
	public List<MyRotateInfo> list = new List<MyRotateInfo>();
	
	public Status(){
	}
	
	public Status(string scene, List<MyRotateInfo> list){
		this.scene = scene;
		this.list = list;
	}
}
