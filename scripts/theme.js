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

// Apply browser chrome themeing. This doesn’t work properly as of 2018-08.
// Depends on: https://bugzilla.mozilla.org/show_bug.cgi?id=1435216
function setThemeStyles(theme) {
  // console.debug(theme);
  if (!theme || !theme.colors)
  {
    return false;
  }

  if (theme.colors.popout || theme.colors.frame)
  {
    document.body.styles.backgroundColor = theme.colors.popout || theme.colors.frame;
  }

  if (theme.colors.popout_text || theme.colors.textcolor)
  {
    document.body.styles.backgroundColor = theme.colors.popout_text || theme.colors.textcolor;
  }

  if (theme.colors.popup_border)
  {
    document.getElementsByClassName('has_border').forEach(
      (node, index, nodelist) => node.styles.borderColor = theme.colors.popup_border
    );
  }

  if (theme.colors.popup_highlight && theme.colors.popup_highlight_text)
  {
    let cssdec = 'div button:hover{background-color:' + theme.colors.popup_highlight + ';color:' + popup_highlight_text + '}';
    let styles = document.createElement('style');
    element.appendChild(document.createTextNode(cssdec));
    document.head.appendChild(styles);
  }
}


// Set initial browser chrome theming integration styles
async function updateCurrentThemeStyles() {
  return browser.theme.getCurrent().then(setThemeStyles, null);
}

updateCurrentThemeStyles();
browser.theme.onUpdated.addListener(updateCurrentThemeStyles);