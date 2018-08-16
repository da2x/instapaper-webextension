// Global states
var authorization = null,
    isAndroid = null;


// Prepare and log error condition responses
function respondError(condition)
{
  console.error('Error condition: ' + condition);
  return {type: 'error', condition: condition};
}


// Delete and unset authroization state
function clearAuthorization()
{
  authorization = null;
  return browser.storage.local.remove('authorization');
}


// Authroize
function getAuthorization()
{
  return new Promise(
    (resolve, reject) =>
    {
      if (authorization !== null)
      {
        resolve({type: 'auth', state: 'authorized'});
        return;
      }
      let authorize = browser.storage.local.get('authorization');
      authorize.then(
        data =>
        {
          if (data && data.authorization != null)
          {
            authorization = data.authorization;
            resolve({type: 'auth', state: 'authorized'});
            return;
          }
          resolve({type: 'auth', state: 'unauthorized'});
        },
        () => resolve({type: 'auth', state: 'failed'})
      );
    }
  );
}


// Set authroization
function setAuthorization(new_auth)
{
  authorization = new_auth;
  return browser.storage.local.set({'authorization': new_auth});
}


// Determine if environment is Android
function setIsAndroid()
{
  browser.runtime.getPlatformInfo().then(
    platformInfo =>
    {
      if (platformInfo.os == 'android')
      {
        isAndroid = true;
      }
      else isAndroid = false;
    }
  );
}


// Validate user credentials
function validateAuth(candidateUserName, candidateUserPass)
{
  return new Promise(
    (resolve, reject) =>
    {
      if (!candidateUserName)
      {
        resolve(respondError('auth_no_credentials'));
      }
      // Instapaper accounts don’t require passwords (!!!) – set to "none" if no password is provided.
      if (!candidateUserPass)
      {
        candidateUserPass = "none";
      }
      var candidateAuthorization = 'Basic ' + btoa(candidateUserName + ':' + candidateUserPass);

      let client = new XMLHttpRequest();
      client.onreadystatechange = (ev) =>
      {
        if (client.readyState == 4)
        {
          if (client.status == 200)
          {
            return setAuthorization(candidateAuthorization).then(
              () => resolve({type: 'auth', state: 'authorized'}),
              () => resolve({type: 'auth', state: 'failed'})
            );
          }
          else if (client.status == 403)
          {
            clearAuthorization();
            resolve(respondError('api_server_unauthorized'));
            return;
          }
          else if (client.status == 500)
          {
            resolve(respondError('api_server_unavailable'));
            return;
          }
          resolve(respondError('api_server_status_' + client.status));
        }
      };
      client.onerror = () => resolve(respondError('xhr_auth_failed'));
      client.open('POST', API_ENDPOINT + 'authenticate');
      client.setRequestHeader('User-Agent', USER_AGENT);
      client.setRequestHeader('Authorization', candidateAuthorization);
      client.send();
    }
  );
}


function saveLink(tab_url, document_extracts, options, active_tab_id)
{
  return new Promise(
    (resolve, reject) =>
    {
      var resolveFinalUrl = 1;
      var encodedUrl = encodeURIComponent(tab_url);
      var encodedTitle = '';
      var encodedDescription = '';
      var encodedContent = '';

      if (document_extracts && document_extracts.url != null)
      {
        encodedUrl = encodeURIComponent(document_extracts.url);
        resolveFinalUrl = 0;
      }
      if (document_extracts && document_extracts.title != null)
      {
        encodedTitle = encodeURIComponent(document_extracts.title);
      }
      if (document_extracts && document_extracts.description != null)
      {
        encodedDescription = encodeURIComponent(document_extracts.description);
      }
      if (document_extracts && document_extracts.content != null)
      {
        encodedContent = encodeURIComponent(document_extracts.content);
      }
      
      

      let client = new XMLHttpRequest();
      client.onreadystatechange = (ev, sendResponse) =>
      {
        if (client.readyState == 4) {
          if (client.status == 201)
          {
            var json = JSON.parse(client.responseText);
            if (json && json.bookmark_id)
            {
              if (options.save_and_close)
              {
                if (isAndroid)
                {
                  // See closePopOut() in browserActions.js
                  browser.tabs.update(
                    {
                      active: true
                    }
                  ).then(
                    () => closeTabs(active_tab_id),
                    () => closeTabs(active_tab_id)
                  ).finally(window.close);
                }
                else
                {
                  closeTabs(active_tab_id);
                }
              }
              if (options.save_and_open)
              {
                var open_url = URL_READ_BOOKMARK + json.bookmark_id;
                openLink(options.open_in_new_tab, active_tab_id, open_url);
              }
              resolve({type: 'save', state: 'saved', bookmark_id: json.bookmark_id});
              return;
            }
            else if (options.save_and_open)
            {
              var open_url = URL_READ_URL + encodeURIComponent(tab_url);
              return openLink(options.open_in_new_tab, active_tab_id, open_url);
            }
            return;
          }
          else if (client.status === 400)
          {
            resolve(respondError('api_server_save_400'));
            return;
          }
          else if (client.status === 403)
          {
            clearAuthorization();
            resolve(respondError('api_server_unauthorized'));
            return;
          }
          else if (client.status === 500)
          {
            resolve(respondError('api_server_unavailable'));
            return;
          }
          resolve(respondError('api_server_status_' + client.status));
        }
      };
      client.onerror = () => resolve(respondError('xhr_save_failed'));
      client.open('POST', API_ENDPOINT + 'add');
      client.setRequestHeader('User-Agent', USER_AGENT);
      client.setRequestHeader('Authorization', authorization);
      client.send('url=' + encodedUrl + '&resolve_final_url=' + resolveFinalUrl + '&title=' + encodedTitle + '&description=' +encodedDescription + '&content=' + encodedContent);
    }
  );
}


// Respond to messages and trigger actions accordingly
function PostOffice(request, sender, sendResponse)
{
  // console.debug('Background PostOffice request received: ' + JSON.stringify(request));
  if (request.type == 'auth')
  {
    if (request.type == 'auth' && request.state == 'request_state')
    {
      return getAuthorization();
    }
    else if (request.validate_credentials)
    { 
      if (request.credentials && request.credentials.userName != undefined)
      {
        return validateAuth(request.credentials.userName, request.credentials.userPass);
      }
      sendResponse(respondError('auth_no_credentials'));
      return;
    }
  }
  else if (request.type == 'save')
  {
    var options =
    {
      save_and_open: request.save_and_open,
      save_and_close: request.save_and_close,
      open_in_new_tab: request.open_in_new_tab
    };
    return browser.tabs.executeScript(
      request.active_tab_id,
      {
        allFrames: false,
        file: '/scripts/inject.js'
      }
    ).then(
      exec_result =>
      {
        if (exec_result.length == 1 && exec_result[0].length == 4)
        {
          var document_extracts =
          {
            url: exec_result[0][0],
            title: exec_result[0][1],
            description: exec_result[0][2],
            content: exec_result[0][3]
          };
          return saveLink(request.url, document_extracts, options, request.active_tab_id);
        }
        return saveLink(request.url, null, options, request.active_tab_id);
      },
      () => saveLink(request.url, null, options, request.active_tab_id)
    );
  }
  else if (request.type == "open")
  {
    if (request.url != undefined)
    {
      return openLink(request.open_in_new_tab, request.active_tab_id, request.url);
    }
    else if (request.special != undefined)
    {
      return openReadingList(request.open_in_new_tab, request.active_tab_id);
    }
  }
}
browser.runtime.onMessage.addListener(PostOffice);


// Initialize
getAuthorization();