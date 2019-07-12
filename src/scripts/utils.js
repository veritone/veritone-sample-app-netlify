/* 'K2' Tutorial App v1.0.0

 Copyright 2019, Veritone, Inc.
 
 For more information about this app, go to: https://docs.veritone.com/#/developer

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

*/

// GLOBALS
const API_ENDPOINT = "https://api.veritone.com/v3/graphql";
const AUTH_BASE  = "https://api.veritone.com/v1/admin/oauth/authorize?scope=all&response_type=token&client_id=";
const CLIENT_ID = "caf06532-6787-45f3-a2e4-8ff02a55012f";
const HOME_URL = "https://veritone-sample-app.netlify.com";
const TEXT_VALIDATION_ERROR_MSG = "That doesn't look right. Try again.";
const DAYS_TO_STORE_TOKEN = 1;
let TDO_ID = null;
let TDO_JSON = null;
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
    let messageNode = document.querySelector( id );
    messageNode.innerHTML = msg;
}

// GraphQL query for obtaining verbose TDO raw data:
let TDO_QUERY_TEMPLATE = `{
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

// Find assets in TDO, and make links out of their signedUri data
function getAssetsAsMarkup( json ) {
	
    if ('assets' in json.data.temporalDataObject ) {
         let records = json.data.temporalDataObject.assets.records;
         let link = '<a href="URL" target="_blank">TARGET</a>';
         let results = [];
         records.forEach( item=> { 
             if (item.signedUri && item.signedUri.length > 0) {
                  var a = link.replace("URL",item.signedUri).replace("TARGET",item.assetType);
                  results.push( a );
             }
         });

         if (results.join("").length == 0)
	     return '<div style="font-size:var(--mediumFontSize);"><b>No assets in this TDO</b><br/><div>';
	 
	 return '<div style="font-size:var(--mediumFontSize);"><b>Assets in this TDO:</b><br/>' + 
	     results.join("<br/>") + "</div>"; 
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
    let query = TDO_QUERY_TEMPLATE.replace( /theID/, '"'+ tdoId + '"');
    let payload = createVeritonePayload( query, _token );
    let json = await fetchJSONviaPOST( API_ENDPOINT, payload).catch(e=>{
    	showSnackbar("Check the console... ", 1);
        console.log("Welp. Got this message: " + e.toString());
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
                theInfo += '<img src="' + json.data.temporalDataObject.thumbnailUrl + 
			'" style="width:42%;"><br/>';
	if ('veritoneFile' in json.data.temporalDataObject.details)
		theInfo += "<b>MIME type: </b>" + 
			json.data.temporalDataObject.details.veritoneFile.mimetype + "<br/><br/>";
	theInfo += getAssetsAsMarkup( json ); 
	showMsg( theInfo, "#explain" );
    }
}

// ======== Create Job, Poll, Show Results, etc. =========

let _pollkey = null; // Ugh, this is needed for clearInterval()
let _totalPollAttempts = 0;
const MAX_POLL_ATTEMPTS = 50;
const POLL_INTERVAL = 15000;

// We use the engine named "task-google-video-intelligence-chunk-label":
let DEFAULT_ENGINE = "60755416-766f-4014-bad9-f0ac8d900b86";

function logToScreen(msg, selector) {
  document.querySelector(selector).innerHTML = document.querySelector(selector).innerHTML + "\n" + msg;
}

function clearScreenLog(selector) { 
  document.querySelector(selector).innerHTML = "";
}

function cancelPoll() { 
  if (_pollkey) {
     clearInterval(_pollkey);
     _totalPollAttempts = 0;
     _pollkey = null;
     showSnackbar("Polling has stopped.");
  }
}

async function cancelJob( jobID ) {
	
  let query = `mutation {
    cancelJob(id: "JOB") {
      id
    } 
  }`.replace(/JOB/,jobID);

  let payload = createVeritonePayload( query, _token );
  let json = await fetchJSONviaPOST( API_ENDPOINT, payload).catch(e=>{
    	showSnackbar("Check the console... ", 1);
        console.log("Welp. Got this message: " + e.toString());
    });
	
   logToScreen( "\nRan this query:\n" + query +"\n", "#job_log" )
   logToScreen( "\nGot back:\n" + JSON.stringify(json,null,3), "#job_log" );
}

async function handleJobButtonClick() {
	
   let jobId = "";
	
   clearScreenLog("#job_log");
	
   if (!_token) {
	showSnackbar("Looks like you need to log in first." , true );
	return;
   }
	
   let tdo = TDO_ID;
		
   // Get the query
   let query = createTheJobQuery( tdo, DEFAULT_ENGINE );

   // Create the payload
   let payload = createVeritonePayload( query, _token );
	
   // Kick off the job
   let json = await fetchJSONviaPOST( API_ENDPOINT, payload).catch(e=>{
    	showSnackbar("Check the console.", true );
        console.log("Got this exception:\n" + e.toString());
   });	

   // log an update to UI:
   logToScreen( "We ran this query:\n\n" + query + "\n\n", "#job_log" );
	
   if (json) {
	logToScreen( "We got back this result:\n\n" + JSON.stringify(json,null,3) + "\n\n", "#job_log" );
	if ('errors' in json) {
		showSnackbar("Error. Job aborted.");
		return;
	}
	jobId = json.data.createJob.id;
	logToScreen("The jobId is " + jobId + ".\n", "#job_log");
        
	logToScreen("We will poll for completion every " + POLL_INTERVAL/1000 + 
		    " seconds, a maximum of " + MAX_POLL_ATTEMPTS + 
		    " times.\n", "#job_log");
           
	   // create the Cancel button and display it
	createCancelJobButton( tdo, "#addContentHere" ); 

	   // POLL FOR STATUS
        _pollkey = setInterval(()=>{
                checkTheJobStatus(jobId, DEFAULT_ENGINE)
        }, POLL_INTERVAL);
	   
   } // if json
	
} // handleJobButtonClick()

// This is our polling function. It is called repeatedly.
async function checkTheJobStatus(jobID, engineID) {
	
   _totalPollAttempts += 1;
	
   logToScreen("Poll Attempts = " + _totalPollAttempts + "\n", "#job_log");
   
   let query = `query jobStatus {
          job(id: "JOB_ID") {   
               status
               targetId
               tasks {    
                 records {    
                   status
                   id
                 }
               }
             }
           }`.replace(/JOB_ID/, jobID);
	
   console.log("Polling with query:\n" + query);

   let payload = createVeritonePayload( query, _token );
	
   let json = await fetchJSONviaPOST( API_ENDPOINT, payload)
   .catch(e=>{
    	showSnackbar("Check the console.", true) && console.log("--> " + e.toString());
   });	
   
   // Are we done yet?
   let jobCompleted = (json.data.job.status == 'complete');
	
   // Are all tasks 'complete'?
   let totalTasks = json.data.job.tasks.records.length;
   let completedTasks = 0;
   json.data.job.tasks.records.forEach( t=>{
                completedTasks += (t.status == 'complete');
       });
   let tasksAllCompleted = (completedTasks == totalTasks);
  
   // SUCCESS
   if (jobCompleted && tasksAllCompleted) {

       logToScreen("\nJob complete, all tasks complete.\n", "#job_log");
       cancelPoll();
                
       // remove the Cancel Job button
       clearScreenLog("#addContentHere");

       // Now get the engine's results
       let tdoId = json.data.job.targetId;
       let q = createEngineResultsQuery(tdoId, engineID);
       console.log("We fetched engine results using:\n" + q);
       let thePayload = createVeritonePayload( q, _token );
       let objects = await fetchJSONviaPOST( API_ENDPOINT, thePayload);

        // Show results
       logToScreen("\n=================== RESULTS =====================\n","#job_log");
       logToScreen(JSON.stringify(objects,null,3), "#job_log");
   }
   else logToScreen("\nJob status = " + json.data.job.status + 
                             " & " + completedTasks + 
                             " task(s) complete, out of " + totalTasks, "#job_log");

   // Job failed?
   if (json.data.job.status == 'failed') {
       cancelPoll();
       clearScreenLog("#addContentHere");
       logToScreen("Job failed. Polling has stopped.","#job_log");
   }
	
   // Timed out? 
   if ( _totalPollAttempts >= MAX_POLL_ATTEMPTS ) {
              
       cancelPoll();
              
       // remove the Cancel Job button
       clearScreenLog("#addContentHere");
              
       logToScreen("Stopped polling after MAX_POLL_ATTEMPTS","#job_log");                 
   }
	
}

function createCancelJobButton( jobID, selector ) { 
  let vanish = "clearScreenLog('" + selector + "');";
  let cancelbutton = ` <button 
             class="smallbutton button-red"
             onclick="cancelJob('JOB'); 
	     cancelPoll(); VANISH">
                 Cancel Job
             </button>`.replace(/VANISH/,vanish).replace(/JOB/, jobID);
	
  logToScreen( cancelbutton, selector );
}

function createTheJobQuery(tdoID, engineID) {

    let query = `mutation createJob{
  createJob(input: {
    targetId: "TDO_ID",
    isReprocessJob: true,
    tasks: [
    {
      engineId: "ENGINE_ID"
    }
    ]
  }) {
    id
  }
}`;
	
    return query.replace(/TDO_ID/, tdoID).replace(/ENGINE_ID/, engineID);	
}

function createEngineResultsQuery(tdoID, engineID) {

    return `query getEngineOutput {
  engineResults(tdoId: "TDO",
    engineIds: ["ENGINE_ID"]) {
    records {
      tdoId
      engineId
      jsondata
    }
  }
}`.replace(/TDO/, tdoID).replace(/ENGINE_ID/, engineID);

}
