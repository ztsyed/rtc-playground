var session={};
var Handler={
	sessionExists: function(id){
		if(session[id]==null)
		{
			return false;
		}else
		{
			return true;
		}
	},
	getSession: function(id){
		console.log("Handler:: getSession "+id);
		if(session[id]==null)
		{
			console.log("Session is null "+id);
			return null;
		}
		else{
			console.log(session[id]);
			return session[id];
		}
	},
	setSession: function(id,blob){
		console.log("setSession: "+id+ " "+blob);
		session[id]=blob;
		
	}
}
module.exports=Handler;