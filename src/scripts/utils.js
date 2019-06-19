// GLOBALS
const API_ENDPOINT = "https://api.veritone.com/v3/graphql";
const TEXT_VALIDATION_ERROR_MSG = "That doesn't look right. Try again.";
const DAYS_TO_STORE_TOKEN = 1;
let _token = null;


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

function showToken( selector,  token ) {
    var tmsg = "Good news! Veritone has sent you a small token of appreciation:<br/>" +
        '<div style="color:#288;font-size:7.5pt;">' + token + '</div>';
    showMsg( "", "#message" ); // clear the default msg
    showMsg( tmsg,selector ); 
    document.querySelector(selector).style['overflow-wrap']="break-word"; 
}


// Pass a GraphQL query and a bearer token, get back an object suitable for POSTing.
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
