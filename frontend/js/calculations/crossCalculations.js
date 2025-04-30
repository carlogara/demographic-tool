/**
 * File: crossCalculations.js
 * Location: demographic-tool/frontend/js/calculations/crossCalculations.js
 * Purpose:
 *   - Contains your old crossCalculation(...) function, exactly as originally written.
 * Meta Info:
 *   - Called from dataHandler.js after updateData(...) to fill #cross-calc.
 */

function crossCalculation(locationData, maleRow, femaleRow, individualNationalityKeys) {
  let maxNationality = null;
  let maxCount = 0;
  individualNationalityKeys.forEach(nationality => {
    let count = (parseInt(maleRow[nationality]) || 0) + (parseInt(femaleRow[nationality]) || 0);
    if (count > maxCount) {
      maxCount = count;
      maxNationality = nationality;
    }
  });
  if (!maxNationality) return "";

  let maleNatCount   = parseInt(maleRow[maxNationality])   || 0;
  let femaleNatCount = parseInt(femaleRow[maxNationality]) || 0;
  let mostCommonGender = (maleNatCount >= femaleNatCount) ? "H" : "M";
  let genderLabel = (mostCommonGender === "H") ? "Male" : "Female";

  let ageData = locationData.filter(row => row["Age Group"] !== "Total" && row["Gender"] === mostCommonGender);
  let ageTotals = {};
  let grandTotal = 0;
  ageData.forEach(row => {
    let ageGroup = row["Age Group"];
    let count = parseInt(row[maxNationality]) || 0;
    ageTotals[ageGroup] = (ageTotals[ageGroup] || 0) + count;
    grandTotal += count;
  });
  let maxAgeSegment = null;
  let maxAgeCount = 0;
  let ageBreakdownHTML = "";
  if (grandTotal > 0) {
    Object.keys(ageTotals).forEach(ageGroup => {
      if (ageTotals[ageGroup] > maxAgeCount) {
        maxAgeCount = ageTotals[ageGroup];
        maxAgeSegment = ageGroup;
      }
      let perc = ((ageTotals[ageGroup] / grandTotal) * 100).toFixed(2);
      ageBreakdownHTML += `<p>${ageGroup}: ${perc}%</p>`;
    });
  }

  return `<h2>Cross Calculations</h2>
          <p><strong>Most present individual (foreign) nationality (excluding aggregates):</strong> ${maxNationality} (${maxCount} people)</p>
          <p><strong>Most common gender for ${maxNationality}:</strong> ${genderLabel}</p>
          <p><strong>For ${maxNationality} (${genderLabel}), most common age segment:</strong> ${maxAgeSegment} (${
            grandTotal > 0 ? ((maxAgeCount / grandTotal) * 100).toFixed(2) : 0
          }% of the age breakdown)</p>
          <h3>Age Segment Percentage Breakdown for ${maxNationality} (${genderLabel}):</h3>
          ${ageBreakdownHTML}`;
}
