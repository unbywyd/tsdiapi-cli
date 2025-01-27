
import { Expose } from "class-transformer";    
import { IsString } from "class-validator";
export class HelloWorldResponseDTO {
    @Expose()
    @IsString()
    public message: string;
}