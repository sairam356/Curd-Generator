import axios from 'axios';
import * as yaml from 'yaml';
import { promises as fsPromises } from 'fs';
import OpenAI from "openai";



export class CurdGenerator {
   
    constructor() {

    }

   public async fetchAndParseSwagger(urlOrPath: string, isUrl: boolean = true): Promise<any> {
        let data: string;
        if (isUrl) {
            const response = await axios.get(urlOrPath);
            console.log(response);
            data = response.data;
        } else {
            data = await fsPromises.readFile(urlOrPath, { encoding: 'utf-8' });
        }
        return yaml.parse(data);
    }

   public async generateCode(language: string, componentType: string, modelName: string, operation: string, description: string, promptSuffix: string = "",userInput:string): Promise<any> {
        console.log("######## this called ###########")   
        
        const prompt = `Generate  ${userInput} ${language} code for ${componentType} to handle '${modelName}' ${operation}. ${promptSuffix}Description: ${description}`;
         
         

           const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
        
        const chatCompletion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-3.5-turbo",
        });
        console.log(chatCompletion.choices[0].message.content);
           return chatCompletion;
       
    }

   public async processSwagger(swagger: any, language: string, userInput: string,extension: string): Promise<void> {
        for (const path in swagger.paths) {
            const pathDetails = swagger.paths[path];
            const modelName = path.split('/').pop()?.toUpperCase();
            for (const method in pathDetails) {
                const details = pathDetails[method];
                const operation = method.toUpperCase();
                const description = details.summary || 'No detailed description available.';
                const componentType = `${modelName}${operation}Controller`;
                const componentType1 = `${modelName}${operation}Service`;
                const componentType2 = `${modelName}${operation}Repostiory`;
                const initialCode = await this.generateCode(language, componentType+""+componentType1+""+componentType2, modelName!, operation, description,"",userInput);
                await this.saveToFile(initialCode, `${componentType}.${extension}`);
            }
        }
    }

  public  async saveToFile(code: any, filename: string): Promise<void> {
        await fsPromises.writeFile(filename, code.choices[0].message.content, { encoding: 'utf-8' });
        console.log(`Saved generated code to ${filename}`);
    }
}



