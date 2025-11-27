import fs from 'fs';
import path from 'path';
import Ajv from 'ajv/dist/2020';
import addFormats from 'ajv-formats';

type JSONValue = any;

// Determine project root relative to where npm script is run (client/)
const projectRoot = path.resolve(process.cwd(), '..');
const schemaDir = path.join(projectRoot, 'schema');
const examplesDir = path.join(schemaDir, 'examples');

function readJSON(filePath: string): JSONValue {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

async function main() {
  const ajv = new Ajv();

  const taskSchema = readJSON(path.join(schemaDir, 'task.schema.json'));
  const planSchema = readJSON(path.join(schemaDir, 'plan.schema.json'));
  const userSchema = readJSON(path.join(schemaDir, 'user.schema.json'));

  addFormats(ajv);
  // add all related schemas so $ref resolution works
  ajv.addSchema(taskSchema as object);
  ajv.addSchema(userSchema as object);
  const validateTask = ajv.getSchema(taskSchema.$id as string) ?? ajv.compile(taskSchema as object);
  const validatePlan = ajv.getSchema(planSchema.$id as string) ?? ajv.compile(planSchema as object);

  const files = fs.readdirSync(examplesDir).filter((f) => f.endsWith('.json'));
  if (files.length === 0) {
    console.log('No example files found in', examplesDir);
    process.exit(1);
  }

  let allOk = true;
  for (const file of files) {
    const full = path.join(examplesDir, file);
    console.log('Testing example:', file);
    const data = readJSON(full);

    // If the example contains a top-level plan and tasks array,
    // validate plan against planSchema and each task against taskSchema.
    if ('plan' in data) {
      const plan = data.plan;
      const okPlan = validatePlan(plan);
      if (!okPlan) {
        console.error('Plan validation failed for', file, validatePlan.errors);
        allOk = false;
      }

      if (Array.isArray(data.tasks)) {
        for (const t of data.tasks) {
          const okTask = validateTask(t);
          if (!okTask) {
            console.error('Task validation failed for', file, t.id, validateTask.errors);
            allOk = false;
          }
          // round-trip: stringify & parse
          const serialized = JSON.stringify(t);
          const reparsed = JSON.parse(serialized);
          const okTask2 = validateTask(reparsed);
          if (!okTask2) {
            console.error('Round-trip validation failed for', file, t.id, validateTask.errors);
            allOk = false;
          }
        }
      } else {
        console.warn('No tasks array in example', file);
      }
    } else {
      console.warn('Example missing top-level `plan` object:', file);
      allOk = false;
    }
  }

  if (!allOk) process.exit(2);
  console.log('\nAll examples validated successfully.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
