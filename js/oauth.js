/*#######################OAUTH2.0#################################################################*/
//Authenticate, fetch token and set session
var oauth =  {
    
    settings : xCore.modules.oauth.settings,
    
    login : function(oauthurl, scopes, redirectUrl, clientId)
    {                            
        var params = {}, queryString = location.hash.substring(1), regex = /([^&=]+)=([^&]*)/g, m;
    	while (m = regex.exec(queryString)) {
            params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
        }
        
        var s_access_token = params.access_token;
        //var s_expires_in = params.expires_in;
        //var s_state = params.state;
        //var s_token_type = params.token_type;
        
        if(!s_access_token || s_access_token === "")
        {
            this.makeRequest();
        }
        else
        { 
            this.token = s_access_token;            
        }
        
        this.getUserInfo(s_access_token); //Insuficient Permission???!?!
        
        return this.token;
    },
    
    makeRequest : function()
    {
        var url =  this.settings.oauthurl;
        url +="?scope=" + this.settings.scopes;
        url += "&state=%2Fprofile";
        url += "&redirect_uri=" + this.settings.redirectUrl;
        url += "&response_type=token";
        url += "&client_id=" + this.settings.clientId;        
        location.href = url;
    },
    
   getUserInfo: function(s_access_token) {
            $.ajax({
                url: 'https://www.googleapis.com/oauth2/v1/userinfo?access_token=' + s_access_token,
                data: null,
                success: function(resp) {
                    user    =   resp;
                    ns_interface.isLoggedIn(user);
                    //console.log(user);
                    //$('#uName').append(user.name);
                    //$('#imgHolder').attr('src', user.picture);
                },
                dataType: "jsonp"
            });
    }
};