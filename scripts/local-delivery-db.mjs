// A real SQLite adapter for exercising the same SQL as production Cloudflare D1.
import { DatabaseSync } from 'node:sqlite';
export function localD1(path=':memory:'){
 const sql=new DatabaseSync(path);
 function prepare(query,params=[]){return {
  bind(...values){return prepare(query,values);},
  async first(){return sql.prepare(query).get(...params)||null;},
  async all(){return {results:sql.prepare(query).all(...params)};},
  async run(){const result=sql.prepare(query).run(...params);return {success:true,meta:{changes:Number(result.changes)}};}
 };}
 return {prepare,async batch(statements){sql.exec('BEGIN');try{const results=[];for(const statement of statements)results.push(await statement.run());sql.exec('COMMIT');return results;}catch(error){sql.exec('ROLLBACK');throw error;}},close(){sql.close();}};
}
