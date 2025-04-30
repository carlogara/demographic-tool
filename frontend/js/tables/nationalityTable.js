/**
 * File: nationalityTable.js
 * Location: demographic-tool/frontend/js/tables/nationalityTable.js
 * Purpose:
 *   - Manages the table in #nationalityTable (under #nationality-table-section).
 * Meta Info:
 *   - Called from dataHandler.js after collecting nationality data for a location.
 */

function fillNationalityTable(nationalityData) {
  let tableHTML = "";
  nationalityData.forEach(item => {
    tableHTML += `
      <tr>
        <td>${item.nationality}</td>
        <td>${item.male}</td>
        <td>${item.female}</td>
        <td>${item.total}</td>
      </tr>`;
  });
  $("#nationalityTable tbody").html(tableHTML);
}
