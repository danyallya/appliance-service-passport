import Dexie,{type Table} from 'dexie';
import type {MaintenanceDraft,MaintenanceEvent} from './maintenance-event';
export type OutboxItem={id:string;payload:unknown;createdAt:number;attempts:number;lastError?:string};
export type SavedMaintenanceDraft={id:'current';draft:MaintenanceDraft;updatedAt:number};
export class LocalDatabase extends Dexie {outbox!:Table<OutboxItem,string>;maintenanceEvents!:Table<MaintenanceEvent,string>;maintenanceDrafts!:Table<SavedMaintenanceDraft,string>;constructor(){super("idea-appliance-service-passport");this.version(1).stores({outbox:'id,createdAt,attempts'});this.version(2).stores({outbox:'id,createdAt,attempts',maintenanceEvents:'id,serviceDate,deviceName,updatedAt',maintenanceDrafts:'id,updatedAt'});}}
export const localDatabase=new LocalDatabase();
