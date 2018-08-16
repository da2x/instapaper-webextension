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