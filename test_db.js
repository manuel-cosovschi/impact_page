import Database from 'better-sqlite3';
const db = new Database('test.db');
db.exec('CREATE TABLE test (id INTEGER PRIMARY KEY)');
console.log('Success');
db.close();
