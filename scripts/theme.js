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

function setThemeStyles(theme) {
  // console.debug(theme);
  if (!theme || !theme.colors)
  {
    return false;
  }

  if (theme.colors.popup || theme.colors.frame)
  {
    document.body.style.backgroundColor = theme.colors.popup || theme.colors.frame;
  }

  if (theme.colors.popup_text || theme.colors.textcolor)
  {
    document.body.style.color = theme.colors.popup_text || theme.colors.textcolor;
    document.body.style.color = theme.colors.popup_text || theme.colors.textcolor;
    [].forEach.call(document.getElementsByClassName('menu_item'), (node, index) =>
      {
        node.style.color = theme.colors.popup_text || theme.colors.textcolor
      }
    );
  }

  if (theme.colors.popup_border)
  {
    [].forEach.call(document.getElementsByClassName('has_border'), (node, index) =>
      {
        node.style.borderColor = theme.colors.popup_border
      }
    );
  }

  if (theme.colors.popup_highlight && theme.colors.popup_highlight_text)
  {
    var cssdec = 'div button:hover{background-color:' + theme.colors.popup_highlight + ';color:' + theme.colors.popup_highlight_text + '}';
    var styles = document.createElement('style');
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
