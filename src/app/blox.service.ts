import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'

@Injectable()
export class BloxService {

  constructor(private http: HttpClient) {
  }

  loadAllBlox() {
    return this.http.get('/blox')
  }

}
