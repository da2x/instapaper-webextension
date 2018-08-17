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
var activeTab = null,
    activeTabUri = null;

    
// Dismiss the browserAction pop-out
function closePopOut()
{
  // COMPAT: popouts can’t be window.close() on Firefox for Android, Moving focus
  // back to the active tab (the popout is never active) will close the popout.
  browser.runtime.getPlatformInfo().then(
    platformInfo =>
    {
      if (platformInfo.os == 'android')
      {
        // Moving docus from active to active dismisses the popout. Makes no sense, but it works.
        browser.tabs.update(
          {
            active: true
          }
        ).finally(window.close);
      }
      else
      {
        window.close();
      }
    },
    window.close
  );
}


// Change opening behavior from event keypresses
function getTabOpeningBehavior(ev)
{
  return {open_in_new_tab: (ev && ev.shiftKey) };
}


// Get current tab object and set states
function respondToPageChanges()
{
  var querying = getActiveTab();
  querying.then(
    tabs => {
      if (tabs && tabs.length == 1)
      {
        activeTab  = tabs[0];
      }
      else 
      {
        errorPage('There are no active tabs.', 'Requires a window with an active tab.');
      }
    },
    () => errorPage('Error reading tabs', 'Requires a window with an active tab.')
  );
  // Enable reading buttons only if we have an active and accepable tab 
  querying.finally(
    () =>
    {
      if (activeTab)
      {
        activeTabUri = null;
        if (isFirefoxReaderViewTab(activeTab))
        {
          activeTabUri = firefoxReaderViewToUrl(activeTab.url);
        }
        else if (isWebUrl(activeTab.url))
        {
          activeTabUri = activeTab.url;
        }

        // Disable all buttons
        document.getElementById('btnReadNow').setAttribute('disabled', true);
        document.getElementById('btnReadLater').setAttribute('disabled', true);
        document.getElementById('btnReadClose').setAttribute('disabled', true);
        document.getElementById('btnList').setAttribute('disabled', true);

        if (activeTabUri)
        {
          // Disable read options when already reading on Instapaper
          if (!isInstapaperReadingUrl(activeTabUri))
          {
            // Leave Read now disabled in private windows (user isn’t logged in)
            if (!activeTab.incognito)
            {
              document.getElementById('btnReadNow').removeAttribute('disabled')
            }

            document.getElementById('btnReadLater').removeAttribute('disabled')
            document.getElementById('btnReadClose').removeAttribute('disabled')
          }
        }
          // Leave Reading list disabled when active tab is reading list or in private windows (user isn’t logged in)
        if (!isInstapaperListView(activeTabUri) && !activeTab.incognito)
        {
          document.getElementById('btnList').removeAttribute('disabled');
        }
      }
    }
  );
}


// Changes visible UI
function switchVisibleUi(view)
{
  var menu = document.getElementById('menu_ui'),
      auth = document.getElementById('login_ui'),
      wait = document.getElementById('working');
      warn = document.getElementById('error_ui');

  auth.style.display = 'none';
  menu.style.display = 'none';
  warn.style.display = 'none';
  wait.style.display = 'none';

  switch (view)
  {
    case 'wait':
      wait.style.display = 'block';
      break;
    case 'menu':
      menu.style.display = 'block';
      break;
    case 'auth':
      auth.style.display = 'block';
      break;
    case 'error':
      warn.style.display = 'block';
      break;
  }
}


// Read current tab now
function menuReadNow(ev)
{
  switchVisibleUi('wait');
  var message = getTabOpeningBehavior(ev);

  if (ev && ev.altKey)
  {
    var url = URL_READ_URL + encodeURIComponent(activeTabUri);
    message = Object.assign(
      {
        type: 'open',
        url: url,
        active_tab_id: activeTab.id
      },
      message
    );
  }
  else {
    message = Object.assign(
      {
        type: 'save',
        url: activeTabUri,
        save_and_open: true,
        active_tab_id: activeTab.id
      },
      message
    );
  }
  var readNowRequest = browser.runtime.sendMessage(message);
  readNowRequest.then(handleBackgroundResponses, handleBackgroundResponses)
  readNowRequest.finally(closePopOut);
}


// Read current tab later
function menuReadLater(ev)
{
  switchVisibleUi('wait');
  var readLaterRequest = browser.runtime.sendMessage(
    {
      type: 'save',
      url: activeTabUri
    }
  );
  readLaterRequest.then(handleBackgroundResponses, handleBackgroundResponses)
  readLaterRequest.finally(closePopOut);
}


// Read current tab later
function menuReadLaterAndCloseTab(ev)
{
  switchVisibleUi('wait');
  var saveRequest = browser.runtime.sendMessage(
    {
      type: 'save',
      url: activeTabUri,
      save_and_close: true,
      active_tab_id: activeTab.id
    }
  );
  saveRequest.then(handleBackgroundResponses, handleBackgroundResponses)
  saveRequest.finally(closePopOut);
}


// Open Reading List
function menuOpenReadingList(ev) {
  var openRequest = browser.runtime.sendMessage(
    Object.assign(
      {
        type: 'open',
        special: 'reading_list',
        active_tab_id: activeTab.id
      },
       getTabOpeningBehavior(ev)
    )
  );
  openRequest.then(null, handleBackgroundResponses)
  openRequest.finally(closePopOut);
}


function handleLogin(ev) {
  ev.preventDefault();
  switchVisibleUi('wait');

  var candidateUserName = document.getElementById('inputUserName').value,
      candidateUserPass = document.getElementById('inputUserPass').value,

  authRequest = browser.runtime.sendMessage(
    {
      type: 'auth',
      validate_credentials: true,
      credentials: {
        userName: candidateUserName,
        userPass: candidateUserPass
      }
    }
  )
  authRequest.then(handleBackgroundResponses, handleBackgroundResponses)
}


// Replaces popout UI with an error message
function errorPage(msgTitle, msgText)
{
  var view = document.getElementById('error_ui'),
     error = view.getElementsByTagName('p')[0],
     retry = view.getElementsByTagName('small')[0];

  error.innerText = msgTitle;
  retry.innerText = msgText;
  error.appendChild(retry);
  view.appendChild(error);

  switchVisibleUi('error');
}


// Display an error message in the auth view
function setAuthErrorText(msgText)
{
  document.getElementById('login_ui_fb').innerText = msgText;
  document.getElementById('login_ui_fb').style.display = (msgText !== undefined) ? 'block' : 'none';
}


// Handle responses from background process
function handleBackgroundResponses(message)
{
  // console.debug('Popout message pump: ' + JSON.stringify(message));
  if (message.type == 'auth')
  {
    switch (message.state)
    {
      case 'unauthorized':
         setAuthErrorText();
        switchVisibleUi('auth');
        return;
      case 'authorized':
        setAuthErrorText();
        switchVisibleUi('menu');
        return;
    }
  }
  else if (message.type == 'save')
  {
    return;
  }
  else if (message.type == 'error')
  {
    switch (message.condition)
    {
      case 'api_server_save_400':
        errorPage('Server rejected the request.', 'Please try again later.');
        console.debug(JSON.stringify(message));
        return;
      case 'api_server_unauthorized':
        setAuthErrorText('Your credentials were rejected.')
        switchVisibleUi('auth');
        return;
      case 'api_server_unavailable':
        errorPage('Service is unavailable.', 'Please try again later.');
        console.debug(JSON.stringify(message));
        return;
      case 'auth_no_credentials':
        setAuthErrorText('Please enter your email.')
        switchVisibleUi('auth');
        return;
      case 'xhr_auth_failed':
        setAuthErrorText('Unknown network problem.')
        switchVisibleUi('auth');
        return;
      case 'xhr_save_failed':
        errorPage('Request failed.', 'Possibly an network related issue.')
        return;
      default:
        errorPage('Error!', request.condition);
        break;
    }
  }
  console.debug('Unhandled message: ' + JSON.stringify(message))
}

// Register events in menu UI (popout)
document.getElementById('btnReadNow').addEventListener('click', menuReadNow);
document.getElementById('btnReadLater').addEventListener('click', menuReadLater);
document.getElementById('btnReadClose').addEventListener('click', menuReadLaterAndCloseTab);
document.getElementById('btnList').addEventListener('click', menuOpenReadingList);


// Register events in auth UI (popout)
document.getElementById('formLogin').addEventListener('submit', handleLogin)
document.getElementById('btnLogin').addEventListener('click', handleLogin)


// Reinitialize on changes to tabs or themes
browser.tabs.onActivated.addListener(respondToPageChanges);
browser.tabs.onUpdated.addListener(respondToPageChanges);



// Initialize
switchVisibleUi('wait');
let isAuthed = browser.runtime.sendMessage(
  {
    type: 'auth',
    state: 'request_state'
  }
);
isAuthed.then(handleBackgroundResponses, handleBackgroundResponses);
respondToPageChanges();