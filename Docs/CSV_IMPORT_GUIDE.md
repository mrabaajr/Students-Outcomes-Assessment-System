# CSV Import Feature for Classes

## Overview
The CSV import feature allows faculty members to quickly import student data into their class sections. This feature is now available on the Faculty Classes page.

## How to Use

### Step 1: Prepare Your CSV File
Create a CSV file with the following columns:
- `student_id` - Unique identifier for the student (required)
- `first_name` - Student's first name (required)
- `last_name` - Student's last name (required)
- `program` - Program/Curriculum code (e.g., CPE, CS, IT) (required)
- `year_level` - Year level (1-4) as a number (required)

### Step 2: Sample CSV Format
```
student_id,first_name,last_name,program,year_level
2024-10001,John,Smith,CPE,2
2024-10002,Sarah,Johnson,CPE,2
2024-10003,Michael,Brown,CPE,2
```

A sample file `SAMPLE_IMPORT.csv` is included in the project root for reference.

### Step 3: Import into a Class
1. Navigate to the Faculty Classes page
2. Find the class section you want to import students into (e.g., CPE32S1)
3. Click the **"Import CSV"** button in the section card
4. A modal dialog will appear
5. Click **"Choose File"** and select your prepared CSV file
6. The system will process the file and show you the results:
   - **Created**: New students added to the system
   - **Updated**: Existing students with updated information
   - **Skipped**: Rows that couldn't be processed with error details

### Step 4: Review Results
The import result modal will display:
- ✓ Number of students created
- ✓ Number of students updated
- ⊝ Number of rows skipped (if any)
- Any errors encountered during processing

## CSV Requirements

### Column Names and Types
| Column | Type | Required | Notes |
|--------|------|----------|-------|
| student_id | String | Yes | Must be unique in your system |
| first_name | String | Yes | Student's given name |
| last_name | String | Yes | Student's family name |
| program | String | Yes | Program code (CPE, CS, IT, etc.) |
| year_level | Integer | Yes | Must be 1, 2, 3, or 4 |

### Encoding and Format
- File must be in CSV format (.csv extension)
- File must be UTF-8 encoded
- Standard CSV format with comma delimiters
- First row must contain column headers

## Validation Rules

1. **Student ID**: 
   - Cannot be empty
   - Must be unique (if duplicate, system will update existing student)

2. **Names**: 
   - First and last names cannot be empty
   - Names can contain spaces and special characters

3. **Year Level**:
   - Must be a number
   - Must be between 1 and 4
   - Invalid values will cause the row to be skipped

4. **Program**:
   - Can be any text value representing the program
   - Cannot be empty

## Error Handling

If your import has errors, the system will:
1. Report how many rows were successfully processed
2. List specific errors for rows that couldn't be imported
3. Show which rows had validation issues with the specific problem
4. Allow you to fix the CSV and retry

Example errors:
- "Row 5: Missing student_id, first_name, or last_name"
- "Row 8: year_level must be a number"
- "Row 12: year_level must be between 1 and 4"

## API Endpoint (Technical)

The import functionality uses the following endpoint:

```
POST /api/sections/{section_id}/import-csv/
```

**Parameters:**
- `section_id` (path): The numeric ID of the section
- `file` (form-data): The CSV file to import

**Expected Response:**
```json
{
  "message": "CSV import completed",
  "section": "CPE32S1",
  "created": 8,
  "updated": 2,
  "skipped": 0,
  "errors": []
}
```

## Troubleshooting

### "File encoding error"
- Ensure your CSV file is saved with UTF-8 encoding
- Try opening in Excel, then "Save As" with UTF-8 encoding

### "Missing required columns"
- Check that your CSV has all required columns: student_id, first_name, last_name, program, year_level
- Verify column names are spelled exactly as shown (case-sensitive in validation)

### "Student not imported"
- Check the error message in the results modal
- Verify the year_level is a number between 1-4
- Ensure student_id, first_name, and last_name are not empty

### No response from server
- Ensure the backend server is running (Django dev server)
- Check that the API endpoint is accessible at `http://localhost:8000/api/sections/{id}/import-csv/`
- Check browser console for network errors

## Best Practices

1. **Validate before importing**: Check your CSV file manually before uploading
2. **Small batches**: For large imports, consider splitting into smaller batches
3. **Backup**: Keep a copy of your CSV files for record-keeping
4. **Test first**: Use the sample file to test the feature before importing actual data
5. **Review results**: Always review the import results to ensure all students were processed

## Security Notes

- Only faculty assigned to a section or administrators can import students to that section
- CSV files are processed immediately and not stored on the server
- The import operation is atomic - either all rows succeed or none are committed (in case of critical errors)

## Support

For issues or questions about the CSV import feature, contact the system administrator or refer to the project documentation.
