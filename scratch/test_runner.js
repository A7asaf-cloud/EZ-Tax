/**
 * Automated Unit Test Suite for EZ Tax Backend and App Logic
 * Verifies version tags, dynamic document checks, and calculator formulas.
 */

const fs = require('fs');
const path = require('path');

function runUnitTests() {
  console.log("🧪 Starting EZ Tax Automated Unit Tests...");
  let passed = 0;
  let failed = 0;

  // Test 1: Check Version Matches in App Code and UI HTML
  try {
    const appJs = fs.readFileSync(path.resolve(__dirname, '../app.js'), 'utf8');
    const indexHtml = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
    
    const versionMatchApp = appJs.match(/Code Version (\d+\.\d+)/);
    const versionMatchHtml = indexHtml.match(/id="app-version"[^>]*>v(\d+\.\d+)/);

    if (versionMatchApp && versionMatchHtml && versionMatchApp[1] === versionMatchHtml[1] && versionMatchApp[1] === '3.4') {
      console.log(`✅ TEST 1: Version match passed. Current version tracked: v${versionMatchApp[1]}`);
      passed++;
    } else {
      throw new Error(`Version mismatch! App says ${versionMatchApp ? versionMatchApp[1] : 'null'}, HTML says ${versionMatchHtml ? versionMatchHtml[1] : 'null'}`);
    }
  } catch (e) {
    console.error(`❌ TEST 1: Version check failed. Details: ${e.message}`);
    failed++;
  }

  // Test 2: Verify Soldier Discount points (Max 2 points in 2022)
  try {
    const appJs = fs.readFileSync(path.resolve(__dirname, '../app.js'), 'utf8');
    if (appJs.includes('const points = 2.0; // מקסימום לפי חוק') || appJs.includes('const points = 2.0;')) {
      console.log("✅ TEST 2: Soldier tax credit point max verified (2.0 pts maximum).");
      passed++;
    } else {
      throw new Error("Soldier points logic might not be correctly set to the legal maximum of 2.0.");
    }
  } catch (e) {
    console.error(`❌ TEST 2: Soldier points calculation check failed. Details: ${e.message}`);
    failed++;
  }

  // Test 3: Check Dynamic Subject Line Parameters for Backend Ingestion
  try {
    const appJs = fs.readFileSync(path.resolve(__dirname, '../app.js'), 'utf8');
    if (appJs.includes('מילואים:${data.reserveDuty') && appJs.includes('תרומות:${data.donations')) {
      console.log("✅ TEST 3: Dynamic email subject parameters configured successfully.");
      passed++;
    } else {
      throw new Error("Dynamic subject variables not found in lead email function.");
    }
  } catch (e) {
    console.error(`❌ TEST 3: Ingestion parameters check failed. Details: ${e.message}`);
    failed++;
  }

  // Test 4: Verify that docsHtml in app.js does not contain layout HTML tags (like <div> or <strong>)
  try {
    const appJs = fs.readFileSync(path.resolve(__dirname, '../app.js'), 'utf8');
    const docsHtmlLine = appJs.match(/const docsHtml = [^;]*;/);
    if (docsHtmlLine) {
      const lineStr = docsHtmlLine[0];
      if (lineStr.includes('div') || lineStr.includes('strong') || lineStr.includes('style=')) {
        throw new Error(`docsHtml contains HTML layout tags which will escape! Found: ${lineStr}`);
      }
      console.log("✅ TEST 4: Verified docsHtml does not contain raw layout HTML tags.");
      passed++;
    } else {
      throw new Error("Could not find docsHtml assignment in app.js.");
    }
  } catch (e) {
    console.error(`❌ TEST 4: docsHtml tag check failed. Details: ${e.message}`);
    failed++;
  }

  console.log(`\n📊 Test Run Completed: ${passed} Passed, ${failed} Failed.`);
  process.exit(failed > 0 ? 1 : 0);
}

runUnitTests();
