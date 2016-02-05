'use strict';

let Patterns = {
  whitespace: /\s+/,
  // Explanation by logical grouping
  //
  //  $ as a flag, any replacement requires $ as a prefix
  //  handle any number of whole numbers as well as decimals
  //  prevent selecting otherwise valid strings with our suffixes
  //  OPTIONAL select word-length suffixes with any amount of whitespace
  //  OPTIONAL select single character suffixes, no whitespace allowed
  cash: /\$\s*[0-9,]+(?:\s*\.\s*\d+)?(?![^\s]*(sec|min|hr|day|wk|mo|yr))(?:\s*(trillion|billion|million|thousand))?(?:(k|m|b))?/gi
};

// Return the a float rounding to 1 decimal point.
function fixed1(v) {
  return v.toFixed(1);
}

// A clock in unicode!
//
// ... well, its actually the old Brazilian currency
// but it renders much more compactly than the actual
// clock unicode symbols. Brazil isn't using it anyway.
let clock = '\u{20A2}';

// Cleanly format a provided number of hours
// into something human friendly.
function formatHours(hours, relHours) {

  if (hours < relHours.minute){
    scaled = hours / relHours.second;
    return `${fixed1(scaled)}sec`;
  }

  if (hours < relHours.hour){
    scaled = hours / relHours.minute;
    return `${fixed1(scaled)}min`;
  }

  if (hours < relHours.day) return `${fixed1(hours)}hr`;

  let scaled = 0;

  if (hours < relHours.week){
    scaled = hours / relHours.day;
    return `${fixed1(scaled)}day`;
  }

  if (hours < relHours.month){
    scaled = hours / relHours.week;
    return `${fixed1(scaled)}wk`;
  }

  if (hours < relHours.year){
    scaled = hours / relHours.month;
    return `${fixed1(scaled)}mo`;
  }

  // Default to years, decades are unnecessary.
  scaled = hours / relHours.year;
  return `${fixed1(scaled)}yr`;
}

function runReplaces(country, dynamic, hover,
  debug = false, replacements = 0) {

  let start = performance.now();

  // Grab our current hourly rate
  // and hours in a week
  let hourly = countries[country].hourly;
  let week = countries[country].week;

  // How many hours in each unit of time,
  // we need to know the work week of
  // the country to do this.
  //
  // Relative hours are by time spent working,
  // ie, a 40 hour work week means 40 * hourly
  // can be earned every week.
  let relHours = {
    second: 1 / (3600),
    minute: 1 / 60,
    hour: 1,
    day: week / 5, // Assuming a 5 day work week...
    week: week,
    month: 4 * week,
    year: 12 * 4 * week
  };

  // Common, case-insensitive modifies
  //
  // This allows us to support values such as $100K
  // as some years instead of 'xhrK'
  let suffixes = {
    'k': 1000,
    'm': 1000000,
    'b': 1000000000,
    't': 1000000000000
  };

  let freshReplacements = 0;
  let patternProcessor = (found)=> {

    let text = found.text.replace('$', '').replace(/,/g, '');
    let parsed = parseFloat(text);
    if (isNaN(parsed)) {
      // Ignore this if unparsable
      //
      // Sometimes we just get single dollar signs due to
      // the way styling is done.
      return found.text;
    }

    // Preprocess by converting words into numbers and squishing whitespace
    text = text.replace(/\s*thousand/i, 'k')
               .replace(/\s*million/i, 'm')
               .replace(/\s*billion/i, 'b')
               .replace(/\s*trillion/i, 't');

    // Apply any potential suffixes
    let suffix = text[text.length - 1].toLowerCase();
    if (suffix in suffixes) parsed *= suffixes[suffix];

    let hours = parsed / hourly;

    // Show a clock only if we enough enough room
    //
    // It helps to disambiguate values in large bodies of text.
    let time = formatHours(hours, relHours);
    if (found.node.textContent.length > 10) time = clock + time;

    freshReplacements++;

    return newTemplateInstance(time, found.text, hover);
  };

  // Perform replacements as necessary
  findAndReplaceDOMText(document.body, {
    find: Patterns.cash,
    replace: patternProcessor,
    preset: 'prose'
  });

  let end = performance.now();
  let diff = end - start;

  // If we're supposed to dynamically update and this run
  // didn't take longer than 150ms, run again later.
  if (dynamic && diff < 150){
    setTimeout(()=> runReplaces(country, dynamic, hover,
      debug, freshReplacements + replacements), 200);
  }

  if (freshReplacements > 0 && debug){
    console.log(
    `

      min-wage executed in ${diff.toFixed(2)}ms
      ${freshReplacements} replacements were performed

    `);
  }

  chrome.runtime.sendMessage({
    subject: 'badge',
    count: replacements + freshReplacements
  });

}

let TemplateElement = document.createElement('span');

// Return an instance of the template element we use
// with everything necessary set given its content
// and original data.
function newTemplateInstance(newText, originalText, hover) {
  let instance = TemplateElement.cloneNode(true);
  instance.textContent = newText;
  instance.dataset.originalText = originalText;
  // Add a class to apply hovering
  if (hover) instance.classList.add('min-wage-replacement');
  return instance;
}


// Grab global preferences, we only run at document idle so
// no need to wait for dom ready.
chrome.storage.local.get((prefs)=>{
  console.log(prefs);

  // Set the country as necessary
  let country = prefs.country;
  if (!Object.keys(countries).includes(country)) country = 'United States';

  // Stop if we're not supposed to be running.
  if (prefs.hasOwnProperty('disabled') && prefs.disabled) return;

  // See if we're supposed to be updating regularly
  let dynamic = true;
  if (prefs.hasOwnProperty('dynamic')) dynamic = prefs.dynamic;

  // Check if original prices should appear in a tooltip on hover
  let hover = true;
  if (prefs.hasOwnProperty('hover')) hover = prefs.hover;

  // Check if we're supposed to be providing stats live.
  let debug = prefs.hasOwnProperty('debug') && prefs.debug;

  runReplaces(country, dynamic, hover, debug);
});