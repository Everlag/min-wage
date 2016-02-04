'use strict';

function populateCountryList() {
  let list = document.querySelector('#country-list');

  let choices = Object.keys(countries);
  choices.forEach((c)=>{
    let item = document.createElement('option');
    item.value = c;
    item.textContent = c;
    list.appendChild(item);
  });

}


function populateCountrySelector(country) {
  let c = countrySelector();
  c.value = country;
}

// Insert the relevant value from the selector
function populateWage(country) {
  let container = document.querySelector('#wage');
  let hourly = countries[country].hourly;
  container.textContent = hourly;
}

// Gets the preference for a given checkbox with an associated
// preference named in prefs.
//
// Returns the checked state to set.
function getPrefsCheckbox(prefs, name, standard = false) {

  let set = standard;
  let prexistingDynamic = Object.keys(prefs).includes(name);
  if (prexistingDynamic) set = prefs[name];

  return set;

}

// Package up repeatedly elements as simple functions
let countrySelector = ()=> document.querySelector('#country-selector');

let dynamicToggle = ()=> document.querySelector('#min-wage-dynamic');

let disableToggle = ()=> document.querySelector('#min-wage-disable');

let hoverToggle = ()=> document.querySelector('#min-wage-hover');

// Setup everything we need to listen to keep preferences current
function setInputListeners() {

  countrySelector().addEventListener('input', (e)=>{
    // Handle values we know
    let c = countrySelector().value;
    if (!(c in countries)) return;

    // Persist and update display
    chrome.storage.local.set({'country': c});
    populateWage(c);
  });


  // Listen for changes to user's desire to handle dynamic content
  dynamicToggle().addEventListener('change', ()=>{

    // Persist
    chrome.storage.local.set({'dynamic': dynamicToggle().checked});

  });

  // Listen for changes to user's desire to handle dynamic content
  disableToggle().addEventListener('change', ()=>{

    // Persist
    chrome.storage.local.set({'disabled': disableToggle().checked});

  });

    // Listen for changes to user's desire to handle dynamic content
  hoverToggle().addEventListener('change', ()=>{

    // Persist
    chrome.storage.local.set({'hover': hoverToggle().checked});

  });
}

(function(document) {

  // Grab global preferences
  chrome.storage.local.get((prefs)=>{

    // Get country or set to default
    let country = prefs.country;
    if (!countries.hasOwnProperty(country)) country = 'United States';

    // Set checkboxes as necessary
    dynamicToggle().checked = getPrefsCheckbox(prefs, 'dynamic', false);
    disableToggle().checked = getPrefsCheckbox(prefs, 'disabled', false);
    hoverToggle().checked = getPrefsCheckbox(prefs, 'hover', true);

    // Set inital selector state
    populateCountryList();
    populateCountrySelector(country);
    populateWage(country);

    // Listen for user interaction
    setInputListeners();

  });

  // Set our debug state
  chrome.management.getSelf((r)=>{
    let debug = r.installType === 'development';
    chrome.storage.local.set({'debug': debug});
  });

})(document);
