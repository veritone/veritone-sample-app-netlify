// GLOBALS
const API_ENDPOINT = "https://api.veritone.com/v3/graphql";
const AUTH_BASE  = "https://api.veritone.com/v1/admin/oauth/authorize?scope=all&response_type=token&client_id=";
const CLIENT_ID = "caf06532-6787-45f3-a2e4-8ff02a55012f";
const HOME_URL = "https://vtn-integration-demo.netlify.com";
const TEXT_VALIDATION_ERROR_MSG = "That doesn't look right. Try again.";
const DAYS_TO_STORE_TOKEN = 1;
let TDO_ID = null;
let _token = null;

function showToken( selector, token ) {
    let TOKEN_MSG = "We have a token:<br/>" +
        '<div style="color:#288;font-size:7.5pt;">' + token + '</div>';
    showMsg( TOKEN_MSG, selector ); 
    document.querySelector(selector).style['overflow-wrap']="break-word"; 
}

// onload handler
window.addEventListener("load", function(event) 
{
    let TOKEN_MARKER = "access_token=";
    let TDO_MARKER = "tdoId=";
    let OUR_URL = location.href;
	
        // Eagerly load token from cookie
    if (!_token)
	_token = getCookie( "token" );
	
	// Check if our URL contains a token
    if (OUR_URL.indexOf(TOKEN_MARKER) != -1) {
        _token = OUR_URL.split(TOKEN_MARKER)[1].split("&")[0];
	if ( _token && _token.length > 0 ) {
            showSnackbar("Token obtained via OAuth.");
	    showToken("#smallToken", _token);
	    setCookie("token", _token, DAYS_TO_STORE_TOKEN);
	}
    }
	// Check if URL contains a tdoId
    else if (OUR_URL.indexOf(TDO_MARKER) != -1) {	    
	TDO_ID = OUR_URL.split(TDO_MARKER)[1].split(/[#&]/)[0];
	showSnackbar("TDO ID detected."); // for debug
        showTDO( TDO_ID, "#rawdata" ); 
    }
});

// ==== cookies ====
function setCookie(cname, cvalue, exdays) {
  var d = new Date();
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
  var expires = "expires="+d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
  var name = cname + "=";
  var ca = document.cookie.split(';');
  for(var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

function getOAuthLink() {
	
    let clientID  = CLIENT_ID;
    let auth_base = AUTH_BASE;
    let redirect = "&redirect_uri=" + HOME_URL;
    var OAuthLink = auth_base + clientID + redirect;
	
    return OAuthLink;
}

// Pass a GraphQL query and a bearer token, get payload suitable for POSTing.
function createVeritonePayload( q, token ) {
  
    let theHeaders = {};
    theHeaders["Content-Type"] = "application/json";
    if (token)
       theHeaders["Authorization"] = "Bearer " + token;
  
    let theBody = JSON.stringify({
            "query": q
        });
    
    return {
        body: theBody,
        headers: theHeaders,
        method: "POST"
    }  
}

// Do a POST and get JSON back.
async function fetchJSONviaPOST(url, payload) {
   
    return fetch(url, payload).then(function(response) {
        if (!response.ok) {
            throw new Error("fetch() gave status = " + response.status);
        }
        return response.json();
    });
}

function login() {
  
    var username = document.querySelector("#username").value;
    var pw = document.querySelector("#pw").value;
  
    if (username.length < 6 || pw.length < 2) {
        showSnackbar( TEXT_VALIDATION_ERROR_MSG, true );
        return;
    }
    loginAndGetToken(username, pw);
}

function loginAndGetToken(username, pw) {

    let q = 'mutation userLogin { userLogin(input: {userName: "' + username + '" password: "' + pw + '"}) {token}}';
  
    let payload = createVeritonePayload( q, null );

    fetchJSONviaPOST( API_ENDPOINT, payload ).then(json=>{
        if (!json.data.userLogin) {
            showSnackbar("That log-in didn't work.", true);
            return;
        }
        _token = json.data.userLogin.token;
        console.log(JSON.stringify(json));
        showMsg("Successful log-in! Your token is: <mark><b>" + _token + "</b></mark><br/>", "#message" );
        showSnackbar("Looks good. You got a token.");
	      setCookie("token", _token, DAYS_TO_STORE_TOKEN);
    }
    ).catch( error=>{ 
        showSnackbar( "Error occurred. Check console.", true );
        console.log( error.toString() );
    });
}

/* showSnackbar()

To use this function, put an empty <div id="snackbar"></div>
in the page somewhere, include the CSS (see styles.css),
and call this function to pop the toast. 
The optional 2nd arg makes the toast red.
*/

function showSnackbar(msg, err) {

    let ERROR_COLOR = "#e25";
    let SNACK_DURATION = 3500;

    var x = document.getElementById("snackbar");
    x.innerText = msg;
    x.className = "show";
    var originalBackgroundColor = x.style["background-color"];
    if (err)
        x.style["background-color"] = ERROR_COLOR;

    setTimeout(function() {
        x.className = x.className.replace("show", "");
        x.style["background-color"] = originalBackgroundColor;
    }, SNACK_DURATION);
}

// Utility for showing text in a DOM element
function showMsg(msg, id) {
    var messageNode = document.querySelector( id );
    messageNode.innerHTML = msg;
}

var TDO_QUERY_TEMPLATE = `{
  temporalDataObject(id: theID) {
    name
    id
    details
    description
    assets {
      records {
        id
        assetType
        name
        signedUri
        details
        container {
          id
        }
      }
      count
    }
    status
    engineRuns {
      count
    }
    sourceData {
      source {
        name
        details
      }
      taskId
      sourceId
      scheduledJobId
      engineId
    }
    thumbnailUrl
    organizationId
    jobs {
      count
    }
  }
}
`;

function getAssetsAsMarkup( json ) {
	
    if ('assets' in json.data.temporalDataObject ) {
         var records = json.data.temporalDataObject.assets.records;
         var markup = "";
         var link = '<a href="URL" target="_blank">TARGET</a>';
         var results = [];
         records.forEach( item=> { 
             if (item.signedUri && item.signedUri.length > 0) {
                  var a = link.replace("URL",item.signedUri).replace("TARGET",item.assetType);
                  results.push( a );
             }
         });

         var msg = '<div style="font-size:var(--mediumFontSize);"><b>Assets in this TDO:</b><br/>' + 
	     results.join("<br/>") + "</div>"; 
         if (results.join("").length == 0)
	     msg = '<div style="font-size:var(--mediumFontSize);"><b>No assets in this TDO</b><br/><div>';
	 
	 return msg;
    }
	
    return "";
}


// Display raw TDO data at DOM node given by 'selector'
async function showTDO( tdoId, selector ) {

    if (!_token) {
        showSnackbar("Need a valid token. Please log in.",1);
        return;
    }
    
    // Query to get a single TDO
    var query = TDO_QUERY_TEMPLATE.replace( /theID/, '"'+ tdoId + '"');
    let payload = createVeritonePayload( query, _token );
    var json = await fetchJSONviaPOST( API_ENDPOINT, payload).catch(e=>{
    	showSnackbar("Check the console... ", 1);
        conbsole.log("Welp. Got this message: " + e.toString());
    });

    if (json) {
	    
	    // get the stringified JSON
        let theRawData = JSON.stringify(json,null,3);
	    
	    // check for errors
        if ('errors' in json) {
	    console.log("JSON response contains error messages:\n\n" + theRawData );
	    showSnackbar("Error. Check console.",1);
	    return;
	}	    
	    
	    // show the raw JSON 
        showMsg( theRawData, selector );
	    
	    // show the name of the TDO
	showMsg( json.data.temporalDataObject.name, "#process" );
	    
	    // show some other stuff, like thuymbnail, mimetype, and assets
	var theInfo = "";
	if ('thumbnailUrl' in json.data.temporalDataObject)
                theInfo += '<img src="' + json.data.temporalDataObject.thumbnailUrl + '"><br/>';
	if ('veritoneFile' in json.data.temporalDataObject.details)
		theInfo += "<b>MIME type: </b>" + 
			json.data.temporalDataObject.details.veritoneFile.mimetype + "<br/><br/>";
	theInfo += getAssetsAsMarkup( json ); 
	showMsg( theInfo, "#explain" );
    }
}
