import { Question } from "inquirer";
import { AppParam } from ".";
export interface PluginConfigVariable {
    key: string;
    type: AppParam['type'];
    default: string;
    configurable: boolean;
    description: string;
    inquirer?: Partial<Question>;
    validate?: Record<string, any>;
    transform?: string;
    when?: string;
}
export interface PluginMetadata {
    name: string;
    description: string;
    variables: Array<PluginConfigVariable>;
}
//# sourceMappingURL=types.d.ts.map