var session={};
var Handler={
	
	getSession: function(id){

		console.log("getSession: "+id);
		if(session[id]==null)
		{
			console.log("Session is null "+id);
		}
		else{
			return session[id];
		}
	},
	setSession: function(id,blob){
		console.log("setSession: "+id);
		session[id]=blob;
	}
}
module.exports=Handler;