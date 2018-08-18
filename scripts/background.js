/*
  Copyright © 2018 Daniel Aleksandersen <https://www.daniel.priv.no/>

  This file is part of Read with Instapaper.

  Read with Instapaper is free software: you can redistribute it and/or
  modify it under the terms of the GNU General Public License version
  3 as published by the Free Software Foundation.

  Read with Instapaper is distributed in the hope that it will be
  useful, but WITHOUT ANY WARRANTY; without even the implied warranty
  of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
  General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with Read with Instapaper.
  If not, see <https://www.gnu.org/licenses/>.
*/


// Global states
var authorization = null;


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
        }
      );
      authorize.catch(
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


// Validate user credentials
function validateAuth(candidateUserName, candidateUserPass)
{
  if (!candidateUserName)
  {
    throw new Error('auth_no_credentials');
  }
  // Instapaper accounts don’t require passwords (!!!) – set to "none" if no password is provided.
  if (!candidateUserPass)
  {
    candidateUserPass = "none";
  }

  var candidateAuthorization = 'Basic ' + btoa(candidateUserName + ':' + candidateUserPass);

  return fetch(
    API_ENDPOINT + 'authenticate',
    {
      method: 'POST',
      headers: {
        'User-Agent': USER_AGENT,
        'Authorization': candidateAuthorization,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      redirect: 'error'
    }
  )
  .then(
    response =>
    {
      if (response.status == 200)
      {
        setAuthorization(candidateAuthorization);
        return {type: 'auth', state: 'authorized'};
      }
      else if (response.status == 403)
      {
        clearAuthorization();
        throw new Error('api_server_unauthorized');
      }
      else if (response.status == 500)
      {
        throw new Error('api_server_unavailable');
      }
      else {
        throw new Error('api_server_status_' + client.status);
      }
    }
  )
}


function saveLink(tab_url, document_extracts, options, active_tab_id)
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

  let postData = 'url=' + encodedUrl + '&resolve_final_url=' + resolveFinalUrl + '&title=' + encodedTitle + '&description=' +encodedDescription + '&content=' + encodedContent;

  return fetch(
    API_ENDPOINT + 'add',
    {
      method: 'POST',
      headers: {
        'User-Agent': USER_AGENT,
        'Authorization': authorization,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      redirect: 'error',
      body: postData
    }
  )
  .then(
    response =>
    {
      if (response.status == 201)
      {
        return response.json();
      }
      else if (response.status === 400)
      {
        throw new Error('api_server_save_400');
      }
      else if (response.status === 403)
      {
        clearAuthorization();
        throw new Error('api_server_unauthorized');
      }
      else if (response.status === 500)
      {
        throw new Error('api_server_unavailable');
      }
      else
      {
        throw new Error('api_server_status_' + response.status);
      }
    }
  )
  .then(
    (json_response) =>
    {
      if (json_response.bookmark_id)
      {
        if (options.save_and_open)
        {
          let open_url = URL_READ_BOOKMARK + json_response.bookmark_id;
          return openLink(options.open_in_new_tab, active_tab_id, open_url);
        }
        else if (options.save_and_close)
        {
          // COMPAT: Android needs to close the tab from popover-tab to be able to close itself
          if (IS_ANDROID)
          {
            return true;
          }
          return closeTab(active_tab_id);
        }
      }
    }
  );
}


// Respond to messages and trigger actions accordingly
function PostOffice(request, sender, sendResponse)
{
  // console.debug('Background PostOffice request received: ' + JSON.stringify(request));
  if (request.type == 'auth')
  {
    if (request.state == 'request_state')
    {
      return getAuthorization();
    }
    else if (request.credentials)
    {
      return validateAuth(request.credentials.userName, request.credentials.userPass);
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
    )
    .then(
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
        else
        {
          return saveLink(request.url, null, options, request.active_tab_id);
        }
      }
    )
    .catch(
      () =>
      {
        return saveLink(request.url, null, options, request.active_tab_id);
      }
    );
  }
  else if (request.type == 'open')
  {
    if (request.url != undefined)
    {
      return openLink(request.open_in_new_tab, request.active_tab_id, request.url);;
    }
    else if (request.special != undefined)
    {
      return openReadingList(request.open_in_new_tab, request.active_tab_id);
    }
  }
  else if (request.type == 'close_tab' && request.active_tab_id)
  {
    return closeTab(request.active_tab_id);
  }

  return new Promise((resolve, reject) => reject(new Error('unhandled_other_message')));

}
browser.runtime.onMessage.addListener(PostOffice);


// Initialize
getAuthorization();