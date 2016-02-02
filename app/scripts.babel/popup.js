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

// Insert the relevant value from the selector
function populateWage(country) {
  let container = document.querySelector('#wage');
  let hourly = countries[country].hourly;
  container.textContent = hourly;
}

(function(document) {

  console.log(document);

  // Grab global preferences
  chrome.storage.local.get((prefs)=>{
    // Set the country as necessary
    let country = prefs.country;
    if (!Object.keys(countries).includes(country)) country = 'United States';

    populateCountryList();
    populateCountrySelector(country);
    populateWage(country);

    countrySelector().addEventListener('input', (e)=>{
      // Handle values we know
      let c = countrySelector().value;
      if (!(c in countries)) return;

      chrome.storage.local.set({'country': c});
      populateWage(c);
    });

  });

})(document);
