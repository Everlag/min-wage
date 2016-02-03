'use strict';

console.log(chrome.storage);

// If we're not ready, wait then check again.
function checkReady() {
  if (!document.readyState) {
    setTimeout(runReplaces, 30);
  }else{
    runReplaces();
    // setInterval(runReplaces, 100);
  }
}

console.log(countries);

let CurrentCountry = 'Canada';

let Patterns = {
  whitespace: /\s+/,
  cash: /\$\s*[0-9,]+(?:\s*\.\s*\d+)?(?:\s*(trillion|billion|million|thousand))?(?:(k|m|b))?/gi
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
  return `${fixed1(scaled)}y`;
}

function runReplaces() {

  let start = performance.now();

  console.log('min-wage doing it live!');

  // Grab our current hourly rate
  // and hours in a week
  let hourly = countries[CurrentCountry].hourly;
  let week = countries[CurrentCountry].week;

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

  let replacements = 0;
  let patternProcessor = (found)=> {
    replacements++;

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
    text = text.replace(/\s*thousand/, 'k')
               .replace(/\s*million/, 'm')
               .replace(/\s*billion/, 'b')
               .replace(/\s*trillion/, 't');

    // Apply any potential suffixes
    let suffix = text[text.length - 1].toLowerCase();
    if (suffix in suffixes) parsed *= suffixes[suffix];

    let hours = parsed / hourly;

    // Show a clock only if we enough enough room
    //
    // It helps to disambiguate values in large bodies of text.
    let time = formatHours(hours, relHours);
    if (found.node.textContent.length > 10) time = clock + time;

    return newTemplateInstance(time, found.text);
  };

  findAndReplaceDOMText(document.body, {
    find: Patterns.cash,
    replace: patternProcessor,
    preset: 'prose'
  });

  let end = performance.now();
  let diff = end - start;

  console.log(
  `

    min-wage executed in ${diff.toFixed(2)}ms
    ${replacements} replacements were performed

  `);
}

let TemplateElement = document.createElement('span');

// Return an instance of the template element we use
// with everything necessary set given its content
// and original data.
function newTemplateInstance(newText, originalText) {
  let instance = TemplateElement.cloneNode(true);
  instance.textContent = newText;
  instance.dataset.originalText = originalText;
  instance.classList.add('min-wage-replacement');
  return instance;
}

// Go along the textNodes and do our element-wise replacements
//
// Also, take into consideration that we need to look for the $ prefix.
// function injectReplacements(textNodes, found) {
//   let cursor = 0;
//   // Order what we found to be more convenient for popping
//   // while not buggering up the cursor.
//   let closest = found.reverse().pop();

//   textNodes.forEach((n)=>{

//     // Account for our new position
//     cursor += n.textContent.length;

//     // Perform all necessary injections,
//     // there may be more than one on large text nodes!
//     while(cursor >= closest.pos){

//       let payload = newTemplateInstance(closest);

//       elementReplace(n, payload, closest.originalText);

//       closest = found.pop();

//     }

//   });

//   console.log('?!');
// }

// // Deduplicate and sort what we found
// function cleanFound(ints) {
//   let deduper = new Set(ints);
//   let clean = [];
//   deduper.forEach((p)=> clean.push(p));
//   // Sort the positions so we can simply pop
//   clean.sort((a, b)=> a.pos - b.pos);

//   return clean;
// }

// let TemplateElement = document.createElement('span');

// // Efficiently grabs all text nodes for an element.
// //
// // Courtesy of
// // http://stackoverflow.com/questions/10730309/find-all-text-nodes-in-html-page
// function textNodesUnder(el){
//   let a = [];
//   let walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);

//   let n = walk.nextNode();

//   while(n){
//     a.push(n);
//     n = walk.nextNode();
//   }

//   return a;
// }

// // Inserts el into the provided text node where 'text' would first appear.
// //
// // Returns the text node that comes after the element.
// //
// // This splits the text node into three sections,
// //  TEXT_NODE | el | TEXT_NODE
// // where the text nodes on either side are comprised of the leftover text.
// function elementReplace(textNode, el, pattern) {

//   let parent = textNode.parentNode;
//   if (textNode.nodeName !== '#text') {
//     parent = textNode;
//   }
//   return;

//   // let nodeText = textNode.textContent;
//   // let splitPos = nodeText.toLowerCase().indexOf(pattern);
//   // let sides = [
//   //               nodeText.slice(0, splitPos),
//   //               // Clean up characters other than just the first
//   //               nodeText.slice(splitPos + pattern.length)
//   //             ];

//   // let leftSide = document.createTextNode(sides[0]);
//   // let rightSide = document.createTextNode(sides[1]);
//   // // Insert left side
//   // if (sides[0].length > 0) {
//   //   parent.insertBefore(leftSide, textNode);
//   // }
//   // // Insert right side
//   // if (sides[1].length > 0) {
//   //   parent.insertBefore(rightSide, textNode.nextSibling);
//   // }

//   // if (el.textContent.includes('10')) {
//   //   console.log(leftSide, rightSide);
//   //   console.log(textNode, parent, 'ehhh');
//   // }

//   // // Insert the desired element
//   // //
//   // // Done last as the sides use the textNode as a positional anchor.
//   // parent.replaceChild(el, textNode);
// }

checkReady();