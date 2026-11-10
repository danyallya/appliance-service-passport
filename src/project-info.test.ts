import {describe,expect,it} from 'vitest';
import {projectInfo} from './project-info';
describe("Appliance Service Passport project contract",()=>{it('keeps locale and direction aligned',()=>{expect(projectInfo.slug).toBe("appliance-service-passport");expect(projectInfo.direction).toBe(projectInfo.locale.startsWith('fa')?'rtl':'ltr');expect(projectInfo.firstTask.length).toBeGreaterThan(8);});});
