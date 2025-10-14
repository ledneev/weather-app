export class Icon {
    constructor(name, options = {}) {
        this.name = name;
        this.options = {
            size: 20,
            color: 'currentColor',
            className: '',
            ...options
        };
    }

    render() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', this.options.size);
        svg.setAttribute('height', this.options.size);
        svg.setAttribute('class', `icon icon--${this.name} ${this.options.className}`);
        
        const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        use.setAttribute('href', `/icons/sprite.svg#icon-${this.name}`);
        
        svg.appendChild(use);
        return svg;
    }

    static create(name, options = {}) {
        const icon = new Icon(name, options);
        return icon.render();
    }
}