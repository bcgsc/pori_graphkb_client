import { Injectable } from '@angular/core';


@Injectable()
export class OtherService {
    
    public radixSort(input: number[], base?: number): number[]{
        let b = base | 10;
        let radix, radixKey;

        let radices = {}, buckets = {};
        
        for(let i = 0; i < input.length; i++){
            radices[input[i].toString.length] = 0;
        }

        let curr;

        for(radix in radices){

            for(let i = 0; i < input.length; i++){
                curr = input[i];
                let currLength =curr.toString.length;
                if( currLength >= radix){
                    radixKey = curr.toString()[currLength - radix];

                    if(!buckets.hasOwnProperty(radixKey)){
                        buckets[radixKey] = [];
                    }

                    buckets[radixKey].push(curr);
                } else{
                    if(!buckets.hasOwnProperty('0')) {
                        buckets['0'] = [];
                    }
                    buckets['0'].push(curr);
                }
            }

            let i = 0;

            for( let j = 0; j < b; j++){
                if(buckets[j] != null){
                    let currBucket = buckets[j];
                    for(let k = 0; k < currBucket.length; k++){
                        input[i++] = currBucket[k];
                    }
                }
            }
            buckets = {};
        }
        return input;
    }

}