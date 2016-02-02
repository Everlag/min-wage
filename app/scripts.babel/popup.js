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

// Grab the country stored in the backend!
function populateCountrySelector(country) {
  let c = countrySelector();
  c.value = country;
}

function countrySelector() {
  return document.querySelector('#country-selector');
}

function dynamicToggle() {
  return document.querySelector('#min-wage-dynamic');
}

function disableToggle() {
  return document.querySelector('#min-wage-disable');
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

// Insert the relevant value from the selector
function populateWage(country) {
  let container = document.querySelector('#wage');
  let hourly = countries[country].hourly;
  container.textContent = hourly;
}

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
}

(function(document) {

  console.log(document);

  // Grab global preferences
  chrome.storage.local.get((prefs)=>{
    // Set the country as necessary
    let country = prefs.country;
    if (!Object.keys(countries).includes(country)) country = 'United States';

    // Set checkboxes as necessary
    dynamicToggle().checked = getPrefsCheckbox(prefs, 'dynamic', true);
    disableToggle().checked = getPrefsCheckbox(prefs, 'disabled', false);

    populateCountryList();
    populateCountrySelector(country);
    populateWage(country);

    setInputListeners();

  });

})(document);
