#pragma strict

var menu : GameObject;
var isActive : boolean;

function toggleMenu(){
	isActive = isActive ? false : true;
	menu.SetActive(isActive);
}
