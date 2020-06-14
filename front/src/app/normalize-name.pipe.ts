import { Pipe, PipeTransform } from '@angular/core';
@Pipe({name: 'normalizeName'})
export class NormalizeNamePipe implements PipeTransform {
  transform(name: string): string {
    name = name.split("/").pop().replace(/_/g," ");
    let nameArray: Array<string> = name.split(".");
    if (nameArray.length > 1) {
      nameArray.pop();
      name = nameArray.join(" ");
    }
    return name;
  }
}
