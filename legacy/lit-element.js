import { html, render as litRender } from '../lit-html/lit-html.js'

/**
 * Returns a class with the Lit-Element features, that extends `superclass`.
 * @param {*} superclass
 */
export const LitElement = (superclass) => class extends superclass {

    /**
     * The Attributes of the generated HTMLElement, that should be observed. These are all properties with `reflectToAttribute: true`
     * @readonly
     * @static
     */
    static get observedAttributes() {
        let attrs = [];
        for (const prop in this.properties)
            if (this.properties[prop].reflectToAttribute)
                attrs.push(prop)
        return attrs;
    }

    constructor() {
        super();
        this.__data = {};
        this._methodsToCall = {};
        this.attachShadow({ mode: "open" });
    }

    /**
     * `connectedCallback` gets called when the element is added to the page.
     */
    connectedCallback() {
        const props = this.constructor.properties;
        this._wait = true;
        for (let prop in props)
            this._makeGetterSetter(prop, props[prop])
        delete this._wait;
        litRender(this.render(), this.shadowRoot);
        if (this.afterFirstRender)
            this.afterFirstRender();
    }


    /**
     * Creates the Propertyaccessors for the defined properties of the Element.
     * @param {any} prop 
     * @param {any} info
     */
    _makeGetterSetter(prop, info) {
        Object.defineProperty(this, prop, {
            get() {
                return this.__data[prop]
            },
            set(val) {
                if (typeof info === 'object')
                    if (info.reflectToAttribute && (info.type === Object || info.type === Array))
                        console.warn('Rich Data shouldn\'t be set as attribte!')
                if (typeof info === 'object') {
                    if (info.reflectToAttribute) {
                        this.setAttribute(prop, val)
                    } else this.__data[prop] = val;
                } else this.__data[prop] = val;
                this._propertiesChanged(prop, val)
            }
        });

        if (typeof info === 'object') {
            if (info.observer) {
                if (this[info.observer]) {
                    this._methodsToCall[prop] = this[info.observer].bind(this);
                } else {
                    console.warn(`Method ${info.observer} not defined!`);
                }
            }
            if (info.value) {
                typeof info.value === 'function'
                    ? this[prop] = info.value()
                    : this[prop] = info.value;
            }
        }

        this[prop] = this.getAttribute(prop);
    }

    /**
     * Gets called when the properties change and the Element should rerender.
     * 
     * @param {any} prop 
     * @param {any} val 
     */
    _propertiesChanged(prop, val) {
        if (this._methodsToCall[prop]) {
            this._methodsToCall[prop](val);
        }
        if (!this._wait) {
            litRender(this.render(), this.shadowRoot)
        }
    }

    /**
     * Gets called when an observed attribute changes. Calls `_propertiesChanged`
     * 
     * @param {any} prop 
     * @param {any} old 
     * @param {any} val 
     */
    attributeChangedCallback(prop, old, val) {
        if (this[prop] !== val) {
            const { type } = this.constructor.properties[prop];
            if (type.name === 'Boolean') {
                if (val !== 'false') {
                    this.__data[prop] = this.hasAttribute(prop);
                } else {
                    this.__data[prop] = false
                }
            } else this.__data[prop] = type(val);
            this._propertiesChanged(prop, val);
        }
    }

    /**
     * Returns what lit-html should render.
     * 
     * @returns 
     */
    render() {
        return html`Render Function not defined`
    }

    /**
     * Gets all children with ids.
     * 
     * @readonly
     */
    get $() {
        const arr = this.shadowRoot.querySelectorAll('[id]');
        const obj = {};
        for (const el of arr)
            obj[el.id] = el;

        return obj;
    }
}