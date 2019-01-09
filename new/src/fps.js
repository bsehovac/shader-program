class FPS {

  constructor( styles = true ) {

    this.div = document.createElement( 'div' )
    this.div.innerHTML = 0

    document.body.appendChild( this.div )

    this.elapsed = 0
    this.frame = 0
    this.time = null

    if ( styles === true ) this.styles()

    return this

  }

  update() {

    if ( this.time === null && ( this.time = performance.now() ) ) return

    const now = performance.now()
    const delta = now - this.time
    this.time = now

    this.frame ++
    this.elapsed += delta

    if ( this.elapsed >= 1000 ) {

      this.div.innerHTML = this.frame
      this.frame = 0
      this.elapsed -= 1000

    }

  }

  styles() {

    this.div.style.cssText = `
      position: absolute; top: 10px; left: 10px; background: rgba(128, 128, 128, 0.2); 
      font-size: 13px; font-weight: bold; font-family: monospace; z-index: 9999; 
      color: #fff; border-radius: 5px; padding: 3px 5px;
    `

  }

}