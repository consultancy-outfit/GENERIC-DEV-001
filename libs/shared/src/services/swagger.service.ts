import { INestApplication } from '@nestjs/common';
import {
  OpenAPIObject,
  SwaggerDocumentOptions,
  SwaggerModule,
} from '@nestjs/swagger';
import { toSentenceCase } from '../utils';
import { writeFileSync } from 'fs';

const HttpStatus = {
  GET: 200,
  POST: 201,
  PUT: 202,
  PATCH: 202,
  DELETE: 200,
};

export class SwaggerService {
  static _messages: { [k: string]: string } = {};
  static _document: OpenAPIObject;
  static _currentPermissionId: string;
  static _currentPermissionDependencies = new Set<string>();

  constructor(
    private route: string,
    private app: INestApplication,
    private config: Omit<OpenAPIObject, 'paths'>,
    private companyName?: string,
    private options?: SwaggerDocumentOptions
  ) {
    this.companyName = toSentenceCase(this.companyName);
  }

  public init() {
    const document = SwaggerModule.createDocument(
      this.app,
      {
        ...this.config,
        info: {
          ...this.config.info,
          title: this.config.info.title.replace(
            '(<COMPANY>) ',
            this.companyName ? `(${this.companyName}) ` : ''
          ),
        },
      },
      {
        ...this.options,
        operationIdFactory: (controllerKey, methodKey) => {
          return `${controllerKey.replace('Controller', '')}.${
            methodKey.charAt(0).toUpperCase() + methodKey.slice(1)
          }`;
        },
      }
    );
    if (!SwaggerService._document) {
      SwaggerService._document = document;
    }
    let Schemas = Object.fromEntries(
      Object.entries(SwaggerService._document.components.schemas ?? {}).concat(
        Object.entries(document.components.schemas)
      )
    );
    SwaggerService._document = {
      ...SwaggerService._document,
      paths: Object.fromEntries(
        Object.entries(SwaggerService._document.paths ?? {})
          .concat(Object.entries(document.paths))
          .map(([path, pathObject]) => {
            let updatedPathObject = Object.fromEntries(
              Object.entries(pathObject).map(([method, methodObject]) => {
                const { operationId, ...options } = methodObject;
                SwaggerService._messages[operationId] = '';
                let possibleResponses = Object.entries(options?.responses);
                if (
                  HttpStatus[method.toUpperCase()] !==
                  options[possibleResponses?.[0]?.[0]]
                ) {
                  delete options.responses[possibleResponses?.[0]?.[0]];
                  options.responses[HttpStatus[method.toUpperCase()]] =
                    possibleResponses?.[0]?.[1];
                }
                Object.values(
                  options.responses[HttpStatus[method.toUpperCase()]]
                ).forEach((statusObject: any) => {
                  const contentType = statusObject['application/json'];
                  if (contentType) {
                    let dto = (<any>contentType).schema?.['$ref']?.split(
                      '/'
                    )?.[3];
                    if (dto && (<any>Schemas[dto])?.properties?.message) {
                      const { example, default: _default } = (<any>Schemas[dto])
                        .properties.message;
                      SwaggerService._messages[operationId] =
                        _default || example;
                    }
                  }
                });
                return [method, { ...methodObject, ...options }];
              })
            );
            return [path, updatedPathObject];
          })
      ),
      components: {
        ...SwaggerService._document.components,
        schemas: Schemas,
      },
    };

    document.paths = Object.fromEntries(
      Object.entries(document.paths).sort(
        ([a, _a], [b, _b]) => a.charCodeAt(1) - b.charCodeAt(1)
      )
    );
    SwaggerModule.setup(this.route, this.app, document, {
      customCss: CUSTOM_CSS,
      customJsStr: this.getCustomJS(),
      customSiteTitle: !this.companyName
        ? 'Personnel Library API Gateway'
        : `Personnel Library (${this.companyName}) API Gateway`,
      swaggerOptions: {
        appName: this.companyName,
        requestInterceptor: (req) => {
          let developerName = window.localStorage.getItem('developerName');
          req.headers['developer-name'] = developerName;
          return req;
        },
        defaultModelsExpandDepth: -1,
        docExpansion: 'none',
        persistAuthorization: true,
        tagsSorter: 'alpha',
      },
    });
  }

  static getMessage(controllerKey, methodKey) {
    return SwaggerService._messages[
      `${controllerKey.replace('Controller', '')}.${
        methodKey.charAt(0).toUpperCase() + methodKey.slice(1)
      }`
    ];
  }

  static setCurrentApiUrl(controllerKey, methodKey) {
    this._currentPermissionId = `${controllerKey.replace('Controller', '')}.${
      methodKey.charAt(0).toUpperCase() + methodKey.slice(1)
    }`;
  }

  static setCurrentApiDependencies(dependency) {
    this._currentPermissionDependencies.add(dependency);
  }

  static resetApi() {
    this._currentPermissionId = undefined;
    this._currentPermissionDependencies = new Set();
  }

  private getCustomJS() {
    return `
    const company = "${this.companyName}";
    const switchTheme = (themeButton, clicked) => {
      let swaggerTheme = window.localStorage.getItem('swagger-theme');
      let htmlClasses = document.querySelector("html").classList;
      if (
      ((!swaggerTheme || swaggerTheme == 'light') && !clicked) ||
      (swaggerTheme == 'dark' && clicked)
        )
      {
        (!swaggerTheme || clicked) && (window.localStorage.setItem('swagger-theme', 'light'));
        htmlClasses.remove("dark-ui");
        themeButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="#fff" width="30px" height="30px" viewBox="0 0 35 35" data-name="Layer 2" id="Layer_2"><path d="M18.44,34.68a18.22,18.22,0,0,1-2.94-.24,18.18,18.18,0,0,1-15-20.86A18.06,18.06,0,0,1,9.59.63,2.42,2.42,0,0,1,12.2.79a2.39,2.39,0,0,1,1,2.41L11.9,3.1l1.23.22A15.66,15.66,0,0,0,23.34,21h0a15.82,15.82,0,0,0,8.47.53A2.44,2.44,0,0,1,34.47,25,18.18,18.18,0,0,1,18.44,34.68ZM10.67,2.89a15.67,15.67,0,0,0-5,22.77A15.66,15.66,0,0,0,32.18,24a18.49,18.49,0,0,1-9.65-.64A18.18,18.18,0,0,1,10.67,2.89Z" fill="#fff"></path></svg>';
      }
      else if (
      (swaggerTheme == 'dark' && !clicked) ||
      (swaggerTheme == 'light' && clicked)
        )
      {
        clicked && (window.localStorage.setItem('swagger-theme', 'dark'));
        htmlClasses.add("dark-ui");
        themeButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="30px" height="30px" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="0.312"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g clip-path="url(#a)" fill="#ffffff"> <path d="M12 0a1 1 0 0 1 1 1v4a1 1 0 1 1-2 0V1a1 1 0 0 1 1-1ZM4.929 3.515a1 1 0 0 0-1.414 1.414l2.828 2.828a1 1 0 0 0 1.414-1.414L4.93 3.515ZM1 11a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2H1ZM18 12a1 1 0 0 1 1-1h4a1 1 0 1 1 0 2h-4a1 1 0 0 1-1-1ZM17.657 16.243a1 1 0 0 0-1.414 1.414l2.828 2.828a1 1 0 1 0 1.414-1.414l-2.828-2.828ZM7.757 17.657a1 1 0 1 0-1.414-1.414L3.515 19.07a1 1 0 1 0 1.414 1.414l2.828-2.828ZM20.485 4.929a1 1 0 0 0-1.414-1.414l-2.828 2.828a1 1 0 1 0 1.414 1.414l2.828-2.828ZM13 19a1 1 0 1 0-2 0v4a1 1 0 1 0 2 0v-4ZM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z"></path> </g> <defs> <clipPath id="a"> <path fill="#ffffff" d="M0 0h24v24H0z"></path> </clipPath> </defs> </g></svg>';
      };
    };
  
    window.addEventListener('DOMContentLoaded', () => {
      let themeButton = document.createElement("button");
      themeButton.classList.add("theme-switch");
      document.querySelector('.information-container.wrapper').appendChild(themeButton);
      switchTheme(themeButton);
      themeButton.addEventListener('click', (e) => switchTheme(themeButton, true));
  
      const devNames = {
        Performance: [
          'BE | Muhammad Junaid Amin',
          'FE | Abubakar Saddiq',
          'FE | Ayaz Khan Safi',
          'FE | Salman Khan',
          'FE | Shehroz Saeed Bhatti',
          'FE | Waseem Ullah',
          'FE | Hamad Minhas',
          'FE | Abdullah Sarwar',
          'FE | Ali Hassan',
          'FE | Arsalan Tahir',
          'FE | Khalid Mehmood Khattak',
          'FE | Muhammad Asif',
          'FE | Muhammad Hassan',
          'BE | Ghulam Mustafa',
          'BE | Muhammad Shahzaib',
          'BE | Ghani Ahmed',
          'BE | Naveed Asghar',
          'FS | Shan Maqbool',
          'FS | Jawad Sadiq',
          'DO | Ali Ahmad',
          'PM | Syed Ahmad',
          'PC | Majid Tariq',
          'PC | Adil Khan',
          'PC | Hafsa Karim',
          'QA | Tamoor Arif',
          'QA | Iqra Rafique',
          'QA | Raja Nouman Aqeel',
          'BE | Ahmad Naeem',
          'BE | Arsal Minhaji',
          'BE | Haseeb Ur Rehman',
          'BE | Maaz Ahmad',
          'BE | Muhammad Muzakkar Azad',
          'BE | Soban Taimoor',
          'BE | Usman Bhatti',
          'FE | Fazal Khurram',
          'FE | Hafiz Faisal Amjad',
          'FE | Ijaz Liaqat',
          'FE | Mehmood Khan',
          'FE | Muhammad Ahmed Afzal',
          'FE | Muhammad Ahmer Akram',
          'FE | Muhammad Ashraf Khattak',
          'FE | Nouman Ishtiaq',
          'FE | Raja Sultan',
          'FE | Sajid Saeed',
          'FE | Shahbaz Mughal',
          'FE | Talha Wajdan',
          'FE | Valeed Anjum',
          'FE | Zaka Ullah'
        ].sort(),
        Recruitment: [
          'BE | Muhammad Junaid Amin',
          'PM | Muzammil Saghir',
          'PM | Amna Arif',
          'BE | Ahmad Naeem',
          'BE | Arsal Minhaji',
          'BE | Haseeb Ur Rehman',
          'BE | Maaz Ahmad',
          'BE | Muhammad Muzakkar Azad',
          'BE | Soban Taimoor',
          'BE | Usman Bhatti',
          'FE | Fazal Khurram',
          'FE | Hafiz Faisal Amjad',
          'FE | Ijaz Liaqat',
          'FE | Mehmood Khan',
          'FE | Muhammad Ahmed Afzal',
          'FE | Muhammad Ahmer Akram',
          'FE | Muhammad Ashraf Khattak',
          'FE | Nouman Ishtiaq',
          'FE | Raja Sultan',
          'FE | Sajid Saeed',
          'FE | Shahbaz Mughal',
          'FE | Talha Wajdan',
          'FE | Valeed Anjum',
          'FE | Zaka Ullah'
        ].sort(),
        Onboarding: [
          'BE | Muhammad Junaid Amin',
          'PM | Muzammil Saghir',
          'PM | Amna Arif',
          'BE | Ahmad Naeem',
          'BE | Arsal Minhaji',
          'BE | Haseeb Ur Rehman',
          'BE | Maaz Ahmad',
          'BE | Muhammad Muzakkar Azad',
          'BE | Soban Taimoor',
          'BE | Usman Bhatti',
          'FE | Fazal Khurram',
          'FE | Hafiz Faisal Amjad',
          'FE | Ijaz Liaqat',
          'FE | Mehmood Khan',
          'FE | Muhammad Ahmed Afzal',
          'FE | Muhammad Ahmer Akram',
          'FE | Muhammad Ashraf Khattak',
          'FE | Nouman Ishtiaq',
          'FE | Raja Sultan',
          'FE | Sajid Saeed',
          'FE | Shahbaz Mughal',
          'FE | Talha Wajdan',
          'FE | Valeed Anjum',
          'FE | Zaka Ullah'
        ].sort()
      };
  
      function createModal() {
          const modalContainer = document.createElement("div");
          modalContainer.classList.add("modal-container");

          const modal = document.createElement("div");
          modal.classList.add("modal");
          modal.addEventListener("click", (event) => event.stopPropagation());

          const header = document.createElement("div");
          header.classList.add("header");
          header.textContent = "Say My Name";

          const content = document.createElement("div");
          content.classList.add("content");

          const nameParagraph = document.createElement("p");
          nameParagraph.textContent = "Please select your name:";

          const developerNameSelect = document.createElement("select");
          developerNameSelect.id = "developerName";

          const defaultOption = document.createElement("option");
          defaultOption.value = "";
          defaultOption.disabled = true;
          defaultOption.selected = true;
          defaultOption.textContent = "Select Name";
          developerNameSelect.appendChild(defaultOption);

          for (const name of devNames[company]) {
              const option = document.createElement("option");
              option.value = name;
              option.textContent = name;
              developerNameSelect.appendChild(option);
          }

          content.appendChild(nameParagraph);
          content.appendChild(developerNameSelect);

          const footer = document.createElement("div");
          footer.classList.add("footer");

          const saveButton = document.createElement("button");
          saveButton.textContent = "Save";
          saveButton.addEventListener("click", saveName);

          footer.appendChild(saveButton);

          modal.appendChild(header);
          modal.appendChild(content);
          modal.appendChild(footer);

          modalContainer.appendChild(modal);

          document.body.appendChild(modalContainer);
      }
      function closeModal() {
          const modal = document.querySelector(".modal-container");
          modal.remove();
      }

      function saveName() {
          const developerNameSelect = document.getElementById("developerName");
          const developerName = developerNameSelect.value;
          if (developerName && devNames[company]?.includes(developerName)) {
              localStorage.setItem('developerName', developerName);
              closeModal();
          } else {
              alert("Please select a valid name from the list before saving.");
          }
      }

      function copy(text) {
        return new Promise((resolve, reject) => {
            if (typeof navigator !== "undefined" && typeof navigator.clipboard !== "undefined" && navigator.permissions !== "undefined") {
                const type = "text/plain";
                const blob = new Blob([text], { type });
                const data = [new ClipboardItem({ [type]: blob })];
                navigator.permissions.query({name: "clipboard-write"}).then((permission) => {
                    if (permission.state === "granted" || permission.state === "prompt") {
                        navigator.clipboard.write(data).then(resolve, reject).catch(reject);
                    }
                    else {
                        reject(new Error("Permission not granted!"));
                    }
                });
            }
            else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
                var textarea = document.createElement("textarea");
                textarea.textContent = text;
                textarea.style.position = "fixed";
                textarea.style.width = '2em';
                textarea.style.height = '2em';
                textarea.style.padding = 0;
                textarea.style.border = 'none';
                textarea.style.outline = 'none';
                textarea.style.boxShadow = 'none';
                textarea.style.background = 'transparent';
                document.body.appendChild(textarea);
                textarea.focus();
                textarea.select();
                try {
                    document.execCommand("copy");
                    document.body.removeChild(textarea);
                    resolve();
                }
                catch (e) {
                    document.body.removeChild(textarea);
                    reject(e);
                }
            }
            else {
                reject(new Error("None of copying methods are supported by this browser!"));
            }
        });
        
    }

      let devName = window.localStorage.getItem('developerName');
      if (!devName || !devNames[company]?.includes(devName)) {
          createModal();
      }
      let elements = document.querySelectorAll("[data-tag]");
      elements.forEach(elem => {
        let tag = elem.getAttribute("data-tag");
        elem.addEventListener("contextmenu", (e) => {
          e.preventDefault();
        });
        let btn = document.createElement("button", { class: "copy-btn" });
        btn.className = "copy-btn";
        btn.title="Right-click to copy RTK Query";
        elem.appendChild(btn);

        btn.addEventListener("contextmenu", async (e) => {
          e.preventDefault();
          e.target.disabled = true;
          setTimeout(() => {
            e.target.disabled = false;
          }, 500);
          let response = await fetch(\`/utils/generate-rtk?tag=\${tag}\`, {
            "headers": {
              "accept": "application/json, text/plain, */*",
              "accept-language": "en-US,en;q=0.9"
            },
            "body": null,
            "method": "GET"
          });
          let data = await response.json();
          copy(data.data)
          .then(() => {
            alert('Copied successfully!');
          })
          .catch((err) => {
            alert(err);
          });
        });
      })
    })
  `;
  }
}

const CUSTOM_CSS = `
  * {
    -webkit-transition: background-color 500ms linear;
    -ms-transition: background-color 500ms linear;
    transition: background-color 500ms linear;
  }

  .btn-group > button.btn-copy  {
    margin: 0 10px;
  }

  .modal-container {
    display: flex;
    justify-content: center;
    align-items: center;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 999;
    animation: fadeIn 0.3s;
}

.modal {
    background-color: #f8f8f8;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    max-width: 400px;
    width: 90%;
    opacity: 0;
    transform: translateY(-50px);
    animation: slideIn 0.3s forwards;
}

@keyframes slideIn {
    100% {
        opacity: 1;
        transform: translateY(0);
    }
}

.close {
    font-size: 18px;
    cursor: pointer;
    float: right;
    color: #555;
}

.header {
    font-size: 24px;
    margin-bottom: 20px;
    color: #007BFF;
}

.content {
    margin-bottom: 20px;
}

.content select {
    width: 100%;
    padding: 10px;
    font-size: 16px;
    border-radius: 5px;
    border: 1px solid #ccc;
}

.footer {
    text-align: right;
}

.footer button {
    padding: 10px 20px;
    font-size: 16px;
    border: none;
    border-radius: 5px;
    background-color: #007BFF;
    color: #fff;
    cursor: pointer;
}

.footer button:hover {
    background-color: #0056b3;
}

@keyframes fadeIn {
    0% {
        opacity: 0;
    }
    100% {
        opacity: 1;
    }
}

  .dark-ui symbol path {
    fill: #fff;
  }

  .dark-ui .theme-switch {
    border: 1px solid #fff !important;
  }

  .theme-switch {
    position: fixed;
    bottom: 10px;
    right: 10px;
    border: 1px solid black;
    border-radius: 50%;
    padding: 5px 7px 3px 7px;
    background: #000;
  }

  .topbar {
    display: none !important;
  }

  .json-schema-form-item-add {
    color: transparent !important;
    font-size: 0 !important;
    padding-top: 7px !important;
    margin-top: 10px !important;
  }

  .json-schema-form-item-add::after {
    content: 'Add new item';
    font-size: 12px;
    color: black
  }

  .json-schema-form-item-remove {
    color: transparent !important;
    font-size: 0 !important;
    padding-top: 7px !important;
    margin-left: 10px !important;
  }

  .json-schema-form-item-remove::after {
    content: 'Remove item';
    font-size: 12px;
    color: black
  }

  .parameter__empty_value_toggle {
    display: flex !important;
  }

  .parameters-col_description input {
    width: unset !important;
  }

  .opblock-tag-section.is-open {
    border-radius: 10px;
  }

  .dark-ui #swagger-ui .opblock-tag-section.is-open {
    background: #000;
    border-radius: 10px;
    border-bottom: 1px solid rgba(58, 64, 80, .3);
  }

  #swagger-ui .opblock-tag-section.is-open div.no-margin {
    margin: 0 10px;
  }

  #swagger-ui .model-box-control:focus, #swagger-ui .models-control:focus, #swagger-ui .opblock-summary-control:focus {
    outline: unset;
  }

  #swagger-ui .opblock .opblock-summary .view-line-link.copy-to-clipboard {
    /* margin: 0 5px 0 10px !important;
    width: 30px !important; */
    display: none;
  }

  /* Dark Theme */

  .dark-ui a { color: #8c8cfa; }

  .dark-ui ::-webkit-scrollbar-track-piece { background-color: rgba(255, 255, 255, .2) !important; }

  .dark-ui ::-webkit-scrollbar-track { background-color: rgba(255, 255, 255, .3) !important; }

  .dark-ui ::-webkit-scrollbar-thumb { background-color: rgba(255, 255, 255, .5) !important; }

  .dark-ui embed[type="application/pdf"] { filter: invert(90%); }

  .dark-ui html {
      background: #1f1f1f !important;
      box-sizing: border-box;
      filter: contrast(100%) brightness(100%) saturate(100%);
      overflow-y: scroll;
  }

  .dark-ui body {
      background: #1f1f1f;
      background-color: #1f1f1f;
      background-image: none !important;
  }

  .dark-ui button, .dark-ui input, .dark-ui select, .dark-ui textarea {
      background-color: #1f1f1f;
      color: #bfbfbf;
  }

  .dark-ui font, .dark-ui html { color: #bfbfbf; }

  .dark-ui #swagger-ui, .dark-ui #swagger-ui section h3 { color: #b5bac9; }

  .dark-ui #swagger-ui a { background-color: transparent; }

  .dark-ui .swagger-ui .authorization__btn,
  .dark-ui .swagger-ui .opblock-control-arrow{
    fill: #fff;
  }

  .dark-ui .swagger-ui .response-control-media-type__title{
    color: #fff;
  }

  .dark-ui #swagger-ui mark {
      background-color: #664b00;
      color: #bfbfbf;
  }

  .dark-ui #swagger-ui legend { color: inherit; }

  .dark-ui #swagger-ui .debug * { outline: #e6da99 solid 1px; }

  .dark-ui #swagger-ui .debug-white * { outline: #fff solid 1px; }

  .dark-ui #swagger-ui .debug-black * { outline: #bfbfbf solid 1px; }

  .dark-ui #swagger-ui .debug-grid { background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyhpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTExIDc5LjE1ODMyNSwgMjAxNS8wOS8xMC0wMToxMDoyMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6MTRDOTY4N0U2N0VFMTFFNjg2MzZDQjkwNkQ4MjgwMEIiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MTRDOTY4N0Q2N0VFMTFFNjg2MzZDQjkwNkQ4MjgwMEIiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTUgKE1hY2ludG9zaCkiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo3NjcyQkQ3NjY3QzUxMUU2QjJCQ0UyNDA4MTAwMjE3MSIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo3NjcyQkQ3NzY3QzUxMUU2QjJCQ0UyNDA4MTAwMjE3MSIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PsBS+GMAAAAjSURBVHjaYvz//z8DLsD4gcGXiYEAGBIKGBne//fFpwAgwAB98AaF2pjlUQAAAABJRU5ErkJggg==) 0 0; }

  .dark-ui #swagger-ui .debug-grid-16 { background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyhpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTExIDc5LjE1ODMyNSwgMjAxNS8wOS8xMC0wMToxMDoyMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6ODYyRjhERDU2N0YyMTFFNjg2MzZDQjkwNkQ4MjgwMEIiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6ODYyRjhERDQ2N0YyMTFFNjg2MzZDQjkwNkQ4MjgwMEIiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTUgKE1hY2ludG9zaCkiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo3NjcyQkQ3QTY3QzUxMUU2QjJCQ0UyNDA4MTAwMjE3MSIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo3NjcyQkQ3QjY3QzUxMUU2QjJCQ0UyNDA4MTAwMjE3MSIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PvCS01IAAABMSURBVHjaYmR4/5+BFPBfAMFm/MBgx8RAGWCn1AAmSg34Q6kBDKMGMDCwICeMIemF/5QawEipAWwUhwEjMDvbAWlWkvVBwu8vQIABAEwBCph8U6c0AAAAAElFTkSuQmCC) 0 0; }

  .dark-ui #swagger-ui .debug-grid-8-solid { background: url(data:image/jpeg;base64,/9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAAAAAAD/4QMxaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjYtYzExMSA3OS4xNTgzMjUsIDIwMTUvMDkvMTAtMDE6MTA6MjAgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE1IChNYWNpbnRvc2gpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOkIxMjI0OTczNjdCMzExRTZCMkJDRTI0MDgxMDAyMTcxIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOkIxMjI0OTc0NjdCMzExRTZCMkJDRTI0MDgxMDAyMTcxIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6QjEyMjQ5NzE2N0IzMTFFNkIyQkNFMjQwODEwMDIxNzEiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6QjEyMjQ5NzI2N0IzMTFFNkIyQkNFMjQwODEwMDIxNzEiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7/7gAOQWRvYmUAZMAAAAAB/9sAhAAbGhopHSlBJiZBQi8vL0JHPz4+P0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHAR0pKTQmND8oKD9HPzU/R0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0f/wAARCAAIAAgDASIAAhEBAxEB/8QAWQABAQAAAAAAAAAAAAAAAAAAAAYBAQEAAAAAAAAAAAAAAAAAAAIEEAEBAAMBAAAAAAAAAAAAAAABADECA0ERAAEDBQAAAAAAAAAAAAAAAAARITFBUWESIv/aAAwDAQACEQMRAD8AoOnTV1QTD7JJshP3vSM3P//Z) 0 0 #1c1c21; }

  .dark-ui #swagger-ui .debug-grid-16-solid { background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyhpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTExIDc5LjE1ODMyNSwgMjAxNS8wOS8xMC0wMToxMDoyMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTUgKE1hY2ludG9zaCkiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6NzY3MkJEN0U2N0M1MTFFNkIyQkNFMjQwODEwMDIxNzEiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6NzY3MkJEN0Y2N0M1MTFFNkIyQkNFMjQwODEwMDIxNzEiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo3NjcyQkQ3QzY3QzUxMUU2QjJCQ0UyNDA4MTAwMjE3MSIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo3NjcyQkQ3RDY3QzUxMUU2QjJCQ0UyNDA4MTAwMjE3MSIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pve6J3kAAAAzSURBVHjaYvz//z8D0UDsMwMjSRoYP5Gq4SPNbRjVMEQ1fCRDg+in/6+J1AJUxsgAEGAA31BAJMS0GYEAAAAASUVORK5CYII=) 0 0 #1c1c21; }

  .dark-ui #swagger-ui .b--black { border-color: #000; }

  .dark-ui #swagger-ui .b--near-black { border-color: #121212; }

  .dark-ui #swagger-ui .b--dark-gray { border-color: #333; }

  .dark-ui #swagger-ui .b--mid-gray { border-color: #545454; }

  .dark-ui #swagger-ui .b--gray { border-color: #787878; }

  .dark-ui #swagger-ui .b--silver { border-color: #999; }

  .dark-ui #swagger-ui .b--light-silver { border-color: #6e6e6e; }

  .dark-ui #swagger-ui .b--moon-gray { border-color: #4d4d4d; }

  .dark-ui #swagger-ui .b--light-gray { border-color: #2b2b2b; }

  .dark-ui #swagger-ui .b--near-white { border-color: #242424; }

  .dark-ui #swagger-ui .b--white { border-color: #1c1c21; }

  .dark-ui #swagger-ui .b--white-90 { border-color: rgba(28, 28, 33, .9); }

  .dark-ui #swagger-ui .b--white-80 { border-color: rgba(28, 28, 33, .8); }

  .dark-ui #swagger-ui .b--white-70 { border-color: rgba(28, 28, 33, .7); }

  .dark-ui #swagger-ui .b--white-60 { border-color: rgba(28, 28, 33, .6); }

  .dark-ui #swagger-ui .b--white-50 { border-color: rgba(28, 28, 33, .5); }

  .dark-ui #swagger-ui .b--white-40 { border-color: rgba(28, 28, 33, .4); }

  .dark-ui #swagger-ui .b--white-30 { border-color: rgba(28, 28, 33, .3); }

  .dark-ui #swagger-ui .b--white-20 { border-color: rgba(28, 28, 33, .2); }

  .dark-ui #swagger-ui .b--white-10 { border-color: rgba(28, 28, 33, .1); }

  .dark-ui #swagger-ui .b--white-05 { border-color: rgba(28, 28, 33, .05); }

  .dark-ui #swagger-ui .b--white-025 { border-color: rgba(28, 28, 33, .024); }

  .dark-ui #swagger-ui .b--white-0125 { border-color: rgba(28, 28, 33, .01); }

  .dark-ui #swagger-ui .b--black-90 { border-color: rgba(0, 0, 0, .9); }

  .dark-ui #swagger-ui .b--black-80 { border-color: rgba(0, 0, 0, .8); }

  .dark-ui #swagger-ui .b--black-70 { border-color: rgba(0, 0, 0, .7); }

  .dark-ui #swagger-ui .b--black-60 { border-color: rgba(0, 0, 0, .6); }

  .dark-ui #swagger-ui .b--black-50 { border-color: rgba(0, 0, 0, .5); }

  .dark-ui #swagger-ui .b--black-40 { border-color: rgba(0, 0, 0, .4); }

  .dark-ui #swagger-ui .b--black-30 { border-color: rgba(0, 0, 0, .3); }

  .dark-ui #swagger-ui .b--black-20 { border-color: rgba(0, 0, 0, .2); }

  .dark-ui #swagger-ui .b--black-10 { border-color: rgba(0, 0, 0, .1); }

  .dark-ui #swagger-ui .b--black-05 { border-color: rgba(0, 0, 0, .05); }

  .dark-ui #swagger-ui .b--black-025 { border-color: rgba(0, 0, 0, .024); }

  .dark-ui #swagger-ui .b--black-0125 { border-color: rgba(0, 0, 0, .01); }

  .dark-ui #swagger-ui .b--dark-red { border-color: #bc2f36; }

  .dark-ui #swagger-ui .b--red { border-color: #c83932; }

  .dark-ui #swagger-ui .b--light-red { border-color: #ab3c2b; }

  .dark-ui #swagger-ui .b--orange { border-color: #cc6e33; }

  .dark-ui #swagger-ui .b--purple { border-color: #5e2ca5; }

  .dark-ui #swagger-ui .b--light-purple { border-color: #672caf; }

  .dark-ui #swagger-ui .b--dark-pink { border-color: #ab2b81; }

  .dark-ui #swagger-ui .b--hot-pink { border-color: #c03086; }

  .dark-ui #swagger-ui .b--pink { border-color: #8f2464; }

  .dark-ui #swagger-ui .b--light-pink { border-color: #721d4d; }

  .dark-ui #swagger-ui .b--dark-green { border-color: #1c6e50; }

  .dark-ui #swagger-ui .b--green { border-color: #279b70; }

  .dark-ui #swagger-ui .b--light-green { border-color: #228762; }

  .dark-ui #swagger-ui .b--navy { border-color: #0d1d35; }

  .dark-ui #swagger-ui .b--dark-blue { border-color: #20497e; }

  .dark-ui #swagger-ui .b--blue { border-color: #4380d0; }

  .dark-ui #swagger-ui .b--light-blue { border-color: #20517e; }

  .dark-ui #swagger-ui .b--lightest-blue { border-color: #143a52; }

  .dark-ui #swagger-ui .b--washed-blue { border-color: #0c312d; }

  .dark-ui #swagger-ui .b--washed-green { border-color: #0f3d2c; }

  .dark-ui #swagger-ui .b--washed-red { border-color: #411010; }

  .dark-ui #swagger-ui .b--transparent { border-color: transparent; }

  .dark-ui #swagger-ui .b--gold, .dark-ui #swagger-ui .b--light-yellow, .dark-ui #swagger-ui .b--washed-yellow, .dark-ui #swagger-ui .b--yellow { border-color: #664b00; }

  .dark-ui #swagger-ui .shadow-1 { box-shadow: rgba(0, 0, 0, .2) 0 0 4px 2px; }

  .dark-ui #swagger-ui .shadow-2 { box-shadow: rgba(0, 0, 0, .2) 0 0 8px 2px; }

  .dark-ui #swagger-ui .shadow-3 { box-shadow: rgba(0, 0, 0, .2) 2px 2px 4px 2px; }

  .dark-ui #swagger-ui .shadow-4 { box-shadow: rgba(0, 0, 0, .2) 2px 2px 8px 0; }

  .dark-ui #swagger-ui .shadow-5 { box-shadow: rgba(0, 0, 0, .2) 4px 4px 8px 0; }

  @media screen and (min-width: 30em) {
      .dark-ui #swagger-ui .shadow-1-ns { box-shadow: rgba(0, 0, 0, .2) 0 0 4px 2px; }

      .dark-ui #swagger-ui .shadow-2-ns { box-shadow: rgba(0, 0, 0, .2) 0 0 8px 2px; }

      .dark-ui #swagger-ui .shadow-3-ns { box-shadow: rgba(0, 0, 0, .2) 2px 2px 4px 2px; }

      .dark-ui #swagger-ui .shadow-4-ns { box-shadow: rgba(0, 0, 0, .2) 2px 2px 8px 0; }

      .dark-ui #swagger-ui .shadow-5-ns { box-shadow: rgba(0, 0, 0, .2) 4px 4px 8px 0; }
  }

  @media screen and (max-width: 60em) and (min-width: 30em) {
      .dark-ui #swagger-ui .shadow-1-m { box-shadow: rgba(0, 0, 0, .2) 0 0 4px 2px; }

      .dark-ui #swagger-ui .shadow-2-m { box-shadow: rgba(0, 0, 0, .2) 0 0 8px 2px; }

      .dark-ui #swagger-ui .shadow-3-m { box-shadow: rgba(0, 0, 0, .2) 2px 2px 4px 2px; }

      .dark-ui #swagger-ui .shadow-4-m { box-shadow: rgba(0, 0, 0, .2) 2px 2px 8px 0; }

      .dark-ui #swagger-ui .shadow-5-m { box-shadow: rgba(0, 0, 0, .2) 4px 4px 8px 0; }
  }

  @media screen and (min-width: 60em) {
      .dark-ui #swagger-ui .shadow-1-l { box-shadow: rgba(0, 0, 0, .2) 0 0 4px 2px; }

      .dark-ui #swagger-ui .shadow-2-l { box-shadow: rgba(0, 0, 0, .2) 0 0 8px 2px; }

      .dark-ui #swagger-ui .shadow-3-l { box-shadow: rgba(0, 0, 0, .2) 2px 2px 4px 2px; }

      .dark-ui #swagger-ui .shadow-4-l { box-shadow: rgba(0, 0, 0, .2) 2px 2px 8px 0; }

      .dark-ui #swagger-ui .shadow-5-l { box-shadow: rgba(0, 0, 0, .2) 4px 4px 8px 0; }
  }

  .dark-ui #swagger-ui .black-05 { color: rgba(191, 191, 191, .05); }

  .dark-ui #swagger-ui .bg-black-05 { background-color: rgba(0, 0, 0, .05); }

  .dark-ui #swagger-ui .black-90, .dark-ui #swagger-ui .hover-black-90:focus, .dark-ui #swagger-ui .hover-black-90:hover { color: rgba(191, 191, 191, .9); }

  .dark-ui #swagger-ui .black-80, .dark-ui #swagger-ui .hover-black-80:focus, .dark-ui #swagger-ui .hover-black-80:hover { color: rgba(191, 191, 191, .8); }

  .dark-ui #swagger-ui .black-70, .dark-ui #swagger-ui .hover-black-70:focus, .dark-ui #swagger-ui .hover-black-70:hover { color: rgba(191, 191, 191, .7); }

  .dark-ui #swagger-ui .black-60, .dark-ui #swagger-ui .hover-black-60:focus, .dark-ui #swagger-ui .hover-black-60:hover { color: rgba(191, 191, 191, .6); }

  .dark-ui #swagger-ui .black-50, .dark-ui #swagger-ui .hover-black-50:focus, .dark-ui #swagger-ui .hover-black-50:hover { color: rgba(191, 191, 191, .5); }

  .dark-ui #swagger-ui .black-40, .dark-ui #swagger-ui .hover-black-40:focus, .dark-ui #swagger-ui .hover-black-40:hover { color: rgba(191, 191, 191, .4); }

  .dark-ui #swagger-ui .black-30, .dark-ui #swagger-ui .hover-black-30:focus, .dark-ui #swagger-ui .hover-black-30:hover { color: rgba(191, 191, 191, .3); }

  .dark-ui #swagger-ui .black-20, .dark-ui #swagger-ui .hover-black-20:focus, .dark-ui #swagger-ui .hover-black-20:hover { color: rgba(191, 191, 191, .2); }

  .dark-ui #swagger-ui .black-10, .dark-ui #swagger-ui .hover-black-10:focus, .dark-ui #swagger-ui .hover-black-10:hover { color: rgba(191, 191, 191, .1); }

  .dark-ui #swagger-ui .hover-white-90:focus, .dark-ui #swagger-ui .hover-white-90:hover, .dark-ui #swagger-ui .white-90 { color: rgba(255, 255, 255, .9); }

  .dark-ui #swagger-ui .hover-white-80:focus, .dark-ui #swagger-ui .hover-white-80:hover, .dark-ui #swagger-ui .white-80 { color: rgba(255, 255, 255, .8); }

  .dark-ui #swagger-ui .hover-white-70:focus, .dark-ui #swagger-ui .hover-white-70:hover, .dark-ui #swagger-ui .white-70 { color: rgba(255, 255, 255, .7); }

  .dark-ui #swagger-ui .hover-white-60:focus, .dark-ui #swagger-ui .hover-white-60:hover, .dark-ui #swagger-ui .white-60 { color: rgba(255, 255, 255, .6); }

  .dark-ui #swagger-ui .hover-white-50:focus, .dark-ui #swagger-ui .hover-white-50:hover, .dark-ui #swagger-ui .white-50 { color: rgba(255, 255, 255, .5); }

  .dark-ui #swagger-ui .hover-white-40:focus, .dark-ui #swagger-ui .hover-white-40:hover, .dark-ui #swagger-ui .white-40 { color: rgba(255, 255, 255, .4); }

  .dark-ui #swagger-ui .hover-white-30:focus, .dark-ui #swagger-ui .hover-white-30:hover, .dark-ui #swagger-ui .white-30 { color: rgba(255, 255, 255, .3); }

  .dark-ui #swagger-ui .hover-white-20:focus, .dark-ui #swagger-ui .hover-white-20:hover, .dark-ui #swagger-ui .white-20 { color: rgba(255, 255, 255, .2); }

  .dark-ui #swagger-ui .hover-white-10:focus, .dark-ui #swagger-ui .hover-white-10:hover, .dark-ui #swagger-ui .white-10 { color: rgba(255, 255, 255, .1); }

  .dark-ui #swagger-ui .hover-moon-gray:focus, .dark-ui #swagger-ui .hover-moon-gray:hover, .dark-ui #swagger-ui .moon-gray { color: #ccc; }

  .dark-ui #swagger-ui .hover-light-gray:focus, .dark-ui #swagger-ui .hover-light-gray:hover, .dark-ui #swagger-ui .light-gray { color: #ededed; }

  .dark-ui #swagger-ui .hover-near-white:focus, .dark-ui #swagger-ui .hover-near-white:hover, .dark-ui #swagger-ui .near-white { color: #f5f5f5; }

  .dark-ui #swagger-ui .dark-red, .dark-ui #swagger-ui .hover-dark-red:focus, .dark-ui #swagger-ui .hover-dark-red:hover { color: #e6999d; }

  .dark-ui #swagger-ui .hover-red:focus, .dark-ui #swagger-ui .hover-red:hover, .dark-ui #swagger-ui .red { color: #e69d99; }

  .dark-ui #swagger-ui .hover-light-red:focus, .dark-ui #swagger-ui .hover-light-red:hover, .dark-ui #swagger-ui .light-red { color: #e6a399; }

  .dark-ui #swagger-ui .hover-orange:focus, .dark-ui #swagger-ui .hover-orange:hover, .dark-ui #swagger-ui .orange { color: #e6b699; }

  .dark-ui #swagger-ui .gold, .dark-ui #swagger-ui .hover-gold:focus, .dark-ui #swagger-ui .hover-gold:hover { color: #e6d099; }

  .dark-ui #swagger-ui .hover-yellow:focus, .dark-ui #swagger-ui .hover-yellow:hover, .dark-ui #swagger-ui .yellow { color: #e6da99; }

  .dark-ui #swagger-ui .hover-light-yellow:focus, .dark-ui #swagger-ui .hover-light-yellow:hover, .dark-ui #swagger-ui .light-yellow { color: #ede6b6; }

  .dark-ui #swagger-ui .hover-purple:focus, .dark-ui #swagger-ui .hover-purple:hover, .dark-ui #swagger-ui .purple { color: #b99ae4; }

  .dark-ui #swagger-ui .hover-light-purple:focus, .dark-ui #swagger-ui .hover-light-purple:hover, .dark-ui #swagger-ui .light-purple { color: #bb99e6; }

  .dark-ui #swagger-ui .dark-pink, .dark-ui #swagger-ui .hover-dark-pink:focus, .dark-ui #swagger-ui .hover-dark-pink:hover { color: #e699cc; }

  .dark-ui #swagger-ui .hot-pink, .dark-ui #swagger-ui .hover-hot-pink:focus, .dark-ui #swagger-ui .hover-hot-pink:hover, .dark-ui #swagger-ui .hover-pink:focus, .dark-ui #swagger-ui .hover-pink:hover, .dark-ui #swagger-ui .pink { color: #e699c7; }

  .dark-ui #swagger-ui .hover-light-pink:focus, .dark-ui #swagger-ui .hover-light-pink:hover, .dark-ui #swagger-ui .light-pink { color: #edb6d5; }

  .dark-ui #swagger-ui .dark-green, .dark-ui #swagger-ui .green, .dark-ui #swagger-ui .hover-dark-green:focus, .dark-ui #swagger-ui .hover-dark-green:hover, .dark-ui #swagger-ui .hover-green:focus, .dark-ui #swagger-ui .hover-green:hover { color: #99e6c9; }

  .dark-ui #swagger-ui .hover-light-green:focus, .dark-ui #swagger-ui .hover-light-green:hover, .dark-ui #swagger-ui .light-green { color: #a1e8ce; }

  .dark-ui #swagger-ui .hover-navy:focus, .dark-ui #swagger-ui .hover-navy:hover, .dark-ui #swagger-ui .navy { color: #99b8e6; }

  .dark-ui #swagger-ui .blue, .dark-ui #swagger-ui .dark-blue, .dark-ui #swagger-ui .hover-blue:focus, .dark-ui #swagger-ui .hover-blue:hover, .dark-ui #swagger-ui .hover-dark-blue:focus, .dark-ui #swagger-ui .hover-dark-blue:hover { color: #99bae6; }

  .dark-ui #swagger-ui .hover-light-blue:focus, .dark-ui #swagger-ui .hover-light-blue:hover, .dark-ui #swagger-ui .light-blue { color: #a9cbea; }

  .dark-ui #swagger-ui .hover-lightest-blue:focus, .dark-ui #swagger-ui .hover-lightest-blue:hover, .dark-ui #swagger-ui .lightest-blue { color: #d6e9f5; }

  .dark-ui #swagger-ui .hover-washed-blue:focus, .dark-ui #swagger-ui .hover-washed-blue:hover, .dark-ui #swagger-ui .washed-blue { color: #f7fdfc; }

  .dark-ui #swagger-ui .hover-washed-green:focus, .dark-ui #swagger-ui .hover-washed-green:hover, .dark-ui #swagger-ui .washed-green { color: #ebfaf4; }

  .dark-ui #swagger-ui .hover-washed-yellow:focus, .dark-ui #swagger-ui .hover-washed-yellow:hover, .dark-ui #swagger-ui .washed-yellow { color: #fbf9ef; }

  .dark-ui #swagger-ui .hover-washed-red:focus, .dark-ui #swagger-ui .hover-washed-red:hover, .dark-ui #swagger-ui .washed-red { color: #f9e7e7; }

  .dark-ui #swagger-ui .color-inherit, .dark-ui #swagger-ui .hover-inherit:focus, .dark-ui #swagger-ui .hover-inherit:hover { color: inherit; }

  .dark-ui #swagger-ui .bg-black-90, .dark-ui #swagger-ui .hover-bg-black-90:focus, .dark-ui #swagger-ui .hover-bg-black-90:hover { background-color: rgba(0, 0, 0, .9); }

  .dark-ui #swagger-ui .bg-black-80, .dark-ui #swagger-ui .hover-bg-black-80:focus, .dark-ui #swagger-ui .hover-bg-black-80:hover { background-color: rgba(0, 0, 0, .8); }

  .dark-ui #swagger-ui .bg-black-70, .dark-ui #swagger-ui .hover-bg-black-70:focus, .dark-ui #swagger-ui .hover-bg-black-70:hover { background-color: rgba(0, 0, 0, .7); }

  .dark-ui #swagger-ui .bg-black-60, .dark-ui #swagger-ui .hover-bg-black-60:focus, .dark-ui #swagger-ui .hover-bg-black-60:hover { background-color: rgba(0, 0, 0, .6); }

  .dark-ui #swagger-ui .bg-black-50, .dark-ui #swagger-ui .hover-bg-black-50:focus, .dark-ui #swagger-ui .hover-bg-black-50:hover { background-color: rgba(0, 0, 0, .5); }

  .dark-ui #swagger-ui .bg-black-40, .dark-ui #swagger-ui .hover-bg-black-40:focus, .dark-ui #swagger-ui .hover-bg-black-40:hover { background-color: rgba(0, 0, 0, .4); }

  .dark-ui #swagger-ui .bg-black-30, .dark-ui #swagger-ui .hover-bg-black-30:focus, .dark-ui #swagger-ui .hover-bg-black-30:hover { background-color: rgba(0, 0, 0, .3); }

  .dark-ui #swagger-ui .bg-black-20, .dark-ui #swagger-ui .hover-bg-black-20:focus, .dark-ui #swagger-ui .hover-bg-black-20:hover { background-color: rgba(0, 0, 0, .2); }

  .dark-ui #swagger-ui .bg-white-90, .dark-ui #swagger-ui .hover-bg-white-90:focus, .dark-ui #swagger-ui .hover-bg-white-90:hover { background-color: rgba(28, 28, 33, .9); }

  .dark-ui #swagger-ui .bg-white-80, .dark-ui #swagger-ui .hover-bg-white-80:focus, .dark-ui #swagger-ui .hover-bg-white-80:hover { background-color: rgba(28, 28, 33, .8); }

  .dark-ui #swagger-ui .bg-white-70, .dark-ui #swagger-ui .hover-bg-white-70:focus, .dark-ui #swagger-ui .hover-bg-white-70:hover { background-color: rgba(28, 28, 33, .7); }

  .dark-ui #swagger-ui .bg-white-60, .dark-ui #swagger-ui .hover-bg-white-60:focus, .dark-ui #swagger-ui .hover-bg-white-60:hover { background-color: rgba(28, 28, 33, .6); }

  .dark-ui #swagger-ui .bg-white-50, .dark-ui #swagger-ui .hover-bg-white-50:focus, .dark-ui #swagger-ui .hover-bg-white-50:hover { background-color: rgba(28, 28, 33, .5); }

  .dark-ui #swagger-ui .bg-white-40, .dark-ui #swagger-ui .hover-bg-white-40:focus, .dark-ui #swagger-ui .hover-bg-white-40:hover { background-color: rgba(28, 28, 33, .4); }

  .dark-ui #swagger-ui .bg-white-30, .dark-ui #swagger-ui .hover-bg-white-30:focus, .dark-ui #swagger-ui .hover-bg-white-30:hover { background-color: rgba(28, 28, 33, .3); }

  .dark-ui #swagger-ui .bg-white-20, .dark-ui #swagger-ui .hover-bg-white-20:focus, .dark-ui #swagger-ui .hover-bg-white-20:hover { background-color: rgba(28, 28, 33, .2); }

  .dark-ui #swagger-ui .bg-black, .dark-ui #swagger-ui .hover-bg-black:focus, .dark-ui #swagger-ui .hover-bg-black:hover { background-color: #000; }

  .dark-ui #swagger-ui .bg-near-black, .dark-ui #swagger-ui .hover-bg-near-black:focus, .dark-ui #swagger-ui .hover-bg-near-black:hover { background-color: #121212; }

  .dark-ui #swagger-ui .bg-dark-gray, .dark-ui #swagger-ui .hover-bg-dark-gray:focus, .dark-ui #swagger-ui .hover-bg-dark-gray:hover { background-color: #333; }

  .dark-ui #swagger-ui .bg-mid-gray, .dark-ui #swagger-ui .hover-bg-mid-gray:focus, .dark-ui #swagger-ui .hover-bg-mid-gray:hover { background-color: #545454; }

  .dark-ui #swagger-ui .bg-gray, .dark-ui #swagger-ui .hover-bg-gray:focus, .dark-ui #swagger-ui .hover-bg-gray:hover { background-color: #787878; }

  .dark-ui #swagger-ui .bg-silver, .dark-ui #swagger-ui .hover-bg-silver:focus, .dark-ui #swagger-ui .hover-bg-silver:hover { background-color: #999; }

  .dark-ui #swagger-ui .bg-white, .dark-ui #swagger-ui .hover-bg-white:focus, .dark-ui #swagger-ui .hover-bg-white:hover { background-color: #1c1c21; }

  .dark-ui #swagger-ui .bg-transparent, .dark-ui #swagger-ui .hover-bg-transparent:focus, .dark-ui #swagger-ui .hover-bg-transparent:hover { background-color: transparent; }

  .dark-ui #swagger-ui .bg-dark-red, .dark-ui #swagger-ui .hover-bg-dark-red:focus, .dark-ui #swagger-ui .hover-bg-dark-red:hover { background-color: #bc2f36; }

  .dark-ui #swagger-ui .bg-red, .dark-ui #swagger-ui .hover-bg-red:focus, .dark-ui #swagger-ui .hover-bg-red:hover { background-color: #c83932; }

  .dark-ui #swagger-ui .bg-light-red, .dark-ui #swagger-ui .hover-bg-light-red:focus, .dark-ui #swagger-ui .hover-bg-light-red:hover { background-color: #ab3c2b; }

  .dark-ui #swagger-ui .bg-orange, .dark-ui #swagger-ui .hover-bg-orange:focus, .dark-ui #swagger-ui .hover-bg-orange:hover { background-color: #cc6e33; }

  .dark-ui #swagger-ui .bg-gold, .dark-ui #swagger-ui .bg-light-yellow, .dark-ui #swagger-ui .bg-washed-yellow, .dark-ui #swagger-ui .bg-yellow, .dark-ui #swagger-ui .hover-bg-gold:focus, .dark-ui #swagger-ui .hover-bg-gold:hover, .dark-ui #swagger-ui .hover-bg-light-yellow:focus, .dark-ui #swagger-ui .hover-bg-light-yellow:hover, .dark-ui #swagger-ui .hover-bg-washed-yellow:focus, .dark-ui #swagger-ui .hover-bg-washed-yellow:hover, .dark-ui #swagger-ui .hover-bg-yellow:focus, .dark-ui #swagger-ui .hover-bg-yellow:hover { background-color: #664b00; }

  .dark-ui #swagger-ui .bg-purple, .dark-ui #swagger-ui .hover-bg-purple:focus, .dark-ui #swagger-ui .hover-bg-purple:hover { background-color: #5e2ca5; }

  .dark-ui #swagger-ui .bg-light-purple, .dark-ui #swagger-ui .hover-bg-light-purple:focus, .dark-ui #swagger-ui .hover-bg-light-purple:hover { background-color: #672caf; }

  .dark-ui #swagger-ui .bg-dark-pink, .dark-ui #swagger-ui .hover-bg-dark-pink:focus, .dark-ui #swagger-ui .hover-bg-dark-pink:hover { background-color: #ab2b81; }

  .dark-ui #swagger-ui .bg-hot-pink, .dark-ui #swagger-ui .hover-bg-hot-pink:focus, .dark-ui #swagger-ui .hover-bg-hot-pink:hover { background-color: #c03086; }

  .dark-ui #swagger-ui .bg-pink, .dark-ui #swagger-ui .hover-bg-pink:focus, .dark-ui #swagger-ui .hover-bg-pink:hover { background-color: #8f2464; }

  .dark-ui #swagger-ui .bg-light-pink, .dark-ui #swagger-ui .hover-bg-light-pink:focus, .dark-ui #swagger-ui .hover-bg-light-pink:hover { background-color: #721d4d; }

  .dark-ui #swagger-ui .bg-dark-green, .dark-ui #swagger-ui .hover-bg-dark-green:focus, .dark-ui #swagger-ui .hover-bg-dark-green:hover { background-color: #1c6e50; }

  .dark-ui #swagger-ui .bg-green, .dark-ui #swagger-ui .hover-bg-green:focus, .dark-ui #swagger-ui .hover-bg-green:hover { background-color: #279b70; }

  .dark-ui #swagger-ui .bg-light-green, .dark-ui #swagger-ui .hover-bg-light-green:focus, .dark-ui #swagger-ui .hover-bg-light-green:hover { background-color: #228762; }

  .dark-ui #swagger-ui .bg-navy, .dark-ui #swagger-ui .hover-bg-navy:focus, .dark-ui #swagger-ui .hover-bg-navy:hover { background-color: #0d1d35; }

  .dark-ui #swagger-ui .bg-dark-blue, .dark-ui #swagger-ui .hover-bg-dark-blue:focus, .dark-ui #swagger-ui .hover-bg-dark-blue:hover { background-color: #20497e; }

  .dark-ui #swagger-ui .bg-blue, .dark-ui #swagger-ui .hover-bg-blue:focus, .dark-ui #swagger-ui .hover-bg-blue:hover { background-color: #4380d0; }

  .dark-ui #swagger-ui .bg-light-blue, .dark-ui #swagger-ui .hover-bg-light-blue:focus, .dark-ui #swagger-ui .hover-bg-light-blue:hover { background-color: #20517e; }

  .dark-ui #swagger-ui .bg-lightest-blue, .dark-ui #swagger-ui .hover-bg-lightest-blue:focus, .dark-ui #swagger-ui .hover-bg-lightest-blue:hover { background-color: #143a52; }

  .dark-ui #swagger-ui .bg-washed-blue, .dark-ui #swagger-ui .hover-bg-washed-blue:focus, .dark-ui #swagger-ui .hover-bg-washed-blue:hover { background-color: #0c312d; }

  .dark-ui #swagger-ui .bg-washed-green, .dark-ui #swagger-ui .hover-bg-washed-green:focus, .dark-ui #swagger-ui .hover-bg-washed-green:hover { background-color: #0f3d2c; }

  .dark-ui #swagger-ui .bg-washed-red, .dark-ui #swagger-ui .hover-bg-washed-red:focus, .dark-ui #swagger-ui .hover-bg-washed-red:hover { background-color: #411010; }

  .dark-ui #swagger-ui .bg-inherit, .dark-ui #swagger-ui .hover-bg-inherit:focus, .dark-ui #swagger-ui .hover-bg-inherit:hover { background-color: inherit; }

  .dark-ui #swagger-ui .shadow-hover { transition: all .5s cubic-bezier(.165, .84, .44, 1) 0s; }

  .dark-ui #swagger-ui .shadow-hover::after {
      border-radius: inherit;
      box-shadow: rgba(0, 0, 0, .2) 0 0 16px 2px;
      content: "";
      height: 100%;
      left: 0;
      opacity: 0;
      position: absolute;
      top: 0;
      transition: opacity .5s cubic-bezier(.165, .84, .44, 1) 0s;
      width: 100%;
      z-index: -1;
  }

  .dark-ui #swagger-ui .bg-animate, .dark-ui #swagger-ui .bg-animate:focus, .dark-ui #swagger-ui .bg-animate:hover { transition: background-color .15s ease-in-out 0s; }

  .dark-ui #swagger-ui .nested-links a {
      color: #99bae6;
      transition: color .15s ease-in 0s;
  }

  .dark-ui #swagger-ui .nested-links a:focus, .dark-ui #swagger-ui .nested-links a:hover {
      color: #a9cbea;
      transition: color .15s ease-in 0s;
  }

  .dark-ui #swagger-ui .opblock-tag {
      border-bottom: 1px solid rgba(58, 64, 80, .3);
      color: #b5bac9;
      transition: all .2s ease 0s;
  }

  .dark-ui #swagger-ui .opblock-tag svg, .dark-ui #swagger-ui section.models h4 svg { transition: all .4s ease 0s; }

  .dark-ui #swagger-ui .opblock {
      border: 1px solid #000;
      border-radius: 4px;
      box-shadow: rgba(0, 0, 0, .19) 0 0 3px;
      margin: 0 0 15px;
  }

  .dark-ui #swagger-ui .opblock .tab-header .tab-item.active h4 span::after { background: gray; }

  .dark-ui #swagger-ui .opblock.is-open .opblock-summary { border-bottom: 1px solid #000; }

  .dark-ui #swagger-ui .opblock .opblock-section-header {
      background: rgba(28, 28, 33, .8);
      box-shadow: rgba(0, 0, 0, .1) 0 1px 2px;
  }

  .dark-ui #swagger-ui .opblock .opblock-section-header > label > span { padding: 0 10px 0 0; }

  .dark-ui #swagger-ui .opblock .opblock-summary-method {
      background: #000;
      color: #fff;
      text-shadow: rgba(0, 0, 0, .1) 0 1px 0;
  }

  .dark-ui #swagger-ui .opblock.opblock-post {
      background: rgba(72, 203, 144, .1);
      border-color: #48cb90;
  }

  .dark-ui #swagger-ui .opblock.opblock-post .opblock-summary-method, .dark-ui #swagger-ui .opblock.opblock-post .tab-header .tab-item.active h4 span::after { background: #48cb90; }

  .dark-ui #swagger-ui .opblock.opblock-post .opblock-summary { border-color: #48cb90; }

  .dark-ui #swagger-ui .opblock.opblock-put {
      background: rgba(213, 157, 88, .1);
      border-color: #d59d58;
  }

  .dark-ui #swagger-ui .opblock.opblock-put .opblock-summary-method, .dark-ui #swagger-ui .opblock.opblock-put .tab-header .tab-item.active h4 span::after { background: #d59d58; }

  .dark-ui #swagger-ui .opblock.opblock-put .opblock-summary { border-color: #d59d58; }

  .dark-ui #swagger-ui .opblock.opblock-delete {
      background: rgba(200, 50, 50, .1);
      border-color: #c83232;
  }

  .dark-ui #swagger-ui .opblock.opblock-delete .opblock-summary-method, .dark-ui #swagger-ui .opblock.opblock-delete .tab-header .tab-item.active h4 span::after { background: #c83232; }

  .dark-ui #swagger-ui .opblock.opblock-delete .opblock-summary { border-color: #c83232; }

  .dark-ui #swagger-ui .opblock.opblock-get {
      background: rgba(42, 105, 167, .1);
      border-color: #2a69a7;
  }

  .dark-ui #swagger-ui .opblock.opblock-get .opblock-summary-method, .dark-ui #swagger-ui .opblock.opblock-get .tab-header .tab-item.active h4 span::after { background: #2a69a7; }

  .dark-ui #swagger-ui .opblock.opblock-get .opblock-summary { border-color: #2a69a7; }

  .dark-ui #swagger-ui .opblock.opblock-patch {
      background: rgba(92, 214, 188, .1);
      border-color: #5cd6bc;
  }

  .dark-ui #swagger-ui .opblock.opblock-patch .opblock-summary-method, .dark-ui #swagger-ui .opblock.opblock-patch .tab-header .tab-item.active h4 span::after { background: #5cd6bc; }

  .dark-ui #swagger-ui .opblock.opblock-patch .opblock-summary { border-color: #5cd6bc; }

  .dark-ui #swagger-ui .opblock.opblock-head {
      background: rgba(140, 63, 207, .1);
      border-color: #8c3fcf;
  }

  .dark-ui #swagger-ui .opblock.opblock-head .opblock-summary-method, .dark-ui #swagger-ui .opblock.opblock-head .tab-header .tab-item.active h4 span::after { background: #8c3fcf; }

  .dark-ui #swagger-ui .opblock.opblock-head .opblock-summary { border-color: #8c3fcf; }

  .dark-ui #swagger-ui .opblock.opblock-options {
      background: rgba(36, 89, 143, .1);
      border-color: #24598f;
  }

  .dark-ui #swagger-ui .opblock.opblock-options .opblock-summary-method, .dark-ui #swagger-ui .opblock.opblock-options .tab-header .tab-item.active h4 span::after { background: #24598f; }

  .dark-ui #swagger-ui .opblock.opblock-options .opblock-summary { border-color: #24598f; }

  .dark-ui #swagger-ui .opblock.opblock-deprecated {
      background: rgba(46, 46, 46, .1);
      border-color: #2e2e2e;
      opacity: .6;
  }

  .dark-ui #swagger-ui .opblock.opblock-deprecated .opblock-summary-method, .dark-ui #swagger-ui .opblock.opblock-deprecated .tab-header .tab-item.active h4 span::after { background: #2e2e2e; }

  .dark-ui #swagger-ui .opblock.opblock-deprecated .opblock-summary { border-color: #2e2e2e; }

  .dark-ui #swagger-ui .filter .operation-filter-input { border: 2px solid #2b3446; }

  .dark-ui #swagger-ui .tab li:first-of-type::after { background: rgba(0, 0, 0, .2); }

  .dark-ui #swagger-ui .download-contents {
      background: #7c8192;
      color: #fff;
  }

  .dark-ui #swagger-ui .scheme-container {
      background: #1c1c21;
      box-shadow: rgba(0, 0, 0, .15) 0 1px 2px 0;
  }

  .dark-ui #swagger-ui .loading-container .loading::before {
      animation: 1s linear 0s infinite normal none running rotation, .5s ease 0s 1 normal none running opacity;
      border-color: rgba(0, 0, 0, .6) rgba(84, 84, 84, .1) rgba(84, 84, 84, .1);
  }

  .dark-ui #swagger-ui .response-control-media-type--accept-controller select { border-color: #196619; }

  .dark-ui #swagger-ui .response-control-media-type__accept-message { color: #99e699; }

  .dark-ui #swagger-ui .version-pragma__message code { background-color: #3b3b3b; }

  .dark-ui #swagger-ui .btn {
      background: 0 0;
      border: 2px solid gray;
      box-shadow: rgba(0, 0, 0, .1) 0 1px 2px;
      color: #b5bac9;
  }

  .dark-ui #swagger-ui .btn:hover { box-shadow: rgba(0, 0, 0, .3) 0 0 5px; }

  .dark-ui #swagger-ui .btn.authorize, .dark-ui #swagger-ui .btn.cancel {
      background-color: transparent;
      border-color: #a72a2a;
      color: #e69999;
  }

  .dark-ui #swagger-ui .btn.authorize {
      border-color: #48cb90;
      color: #9ce3c3;
  }

  .dark-ui #swagger-ui .btn.authorize svg { fill: #9ce3c3; }

  .dark-ui #swagger-ui .btn.execute {
      background-color: #5892d5;
      border-color: #5892d5;
      color: #fff;
  }

  .dark-ui #swagger-ui .copy-to-clipboard { background: #7c8192; }

  .dark-ui #swagger-ui .copy-to-clipboard button { background: url("data:image/svg+xml;charset=utf-8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" aria-hidden=\"true\"><path fill=\"%23fff\" fill-rule=\"evenodd\" d=\"M2 13h4v1H2v-1zm5-6H2v1h5V7zm2 3V8l-3 3 3 3v-2h5v-2H9zM4.5 9H2v1h2.5V9zM2 12h2.5v-1H2v1zm9 1h1v2c-.02.28-.11.52-.3.7-.19.18-.42.28-.7.3H1c-.55 0-1-.45-1-1V4c0-.55.45-1 1-1h3c0-1.11.89-2 2-2 1.11 0 2 .89 2 2h3c.55 0 1 .45 1 1v5h-1V6H1v9h10v-2zM2 5h8c0-.55-.45-1-1-1H8c-.55 0-1-.45-1-1s-.45-1-1-1-1 .45-1 1-.45 1-1 1H3c-.55 0-1 .45-1 1z\"/></svg>") 50% center no-repeat; }

  .dark-ui #swagger-ui select {
      background: url("data:image/svg+xml;charset=utf-8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 20 20\"><path d=\"M13.418 7.859a.695.695 0 01.978 0 .68.68 0 010 .969l-3.908 3.83a.697.697 0 01-.979 0l-3.908-3.83a.68.68 0 010-.969.695.695 0 01.978 0L10 11l3.418-3.141z\"/></svg>") right 10px center/20px no-repeat #212121;
      background: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcKICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIgogICB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM6c29kaXBvZGk9Imh0dHA6Ly9zb2RpcG9kaS5zb3VyY2Vmb3JnZS5uZXQvRFREL3NvZGlwb2RpLTAuZHRkIgogICB4bWxuczppbmtzY2FwZT0iaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvbmFtZXNwYWNlcy9pbmtzY2FwZSIKICAgaW5rc2NhcGU6dmVyc2lvbj0iMS4wICg0MDM1YTRmYjQ5LCAyMDIwLTA1LTAxKSIKICAgc29kaXBvZGk6ZG9jbmFtZT0iZG93bmxvYWQuc3ZnIgogICBpZD0ic3ZnNCIKICAgdmVyc2lvbj0iMS4xIgogICB2aWV3Qm94PSIwIDAgMjAgMjAiPgogIDxtZXRhZGF0YQogICAgIGlkPSJtZXRhZGF0YTEwIj4KICAgIDxyZGY6UkRGPgogICAgICA8Y2M6V29yawogICAgICAgICByZGY6YWJvdXQ9IiI+CiAgICAgICAgPGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+CiAgICAgICAgPGRjOnR5cGUKICAgICAgICAgICByZGY6cmVzb3VyY2U9Imh0dHA6Ly9wdXJsLm9yZy9kYy9kY21pdHlwZS9TdGlsbEltYWdlIiAvPgogICAgICA8L2NjOldvcms+CiAgICA8L3JkZjpSREY+CiAgPC9tZXRhZGF0YT4KICA8ZGVmcwogICAgIGlkPSJkZWZzOCIgLz4KICA8c29kaXBvZGk6bmFtZWR2aWV3CiAgICAgaW5rc2NhcGU6Y3VycmVudC1sYXllcj0ic3ZnNCIKICAgICBpbmtzY2FwZTp3aW5kb3ctbWF4aW1pemVkPSIxIgogICAgIGlua3NjYXBlOndpbmRvdy15PSItOSIKICAgICBpbmtzY2FwZTp3aW5kb3cteD0iLTkiCiAgICAgaW5rc2NhcGU6Y3k9IjEwIgogICAgIGlua3NjYXBlOmN4PSIxMCIKICAgICBpbmtzY2FwZTp6b29tPSI0MS41IgogICAgIHNob3dncmlkPSJmYWxzZSIKICAgICBpZD0ibmFtZWR2aWV3NiIKICAgICBpbmtzY2FwZTp3aW5kb3ctaGVpZ2h0PSIxMDAxIgogICAgIGlua3NjYXBlOndpbmRvdy13aWR0aD0iMTkyMCIKICAgICBpbmtzY2FwZTpwYWdlc2hhZG93PSIyIgogICAgIGlua3NjYXBlOnBhZ2VvcGFjaXR5PSIwIgogICAgIGd1aWRldG9sZXJhbmNlPSIxMCIKICAgICBncmlkdG9sZXJhbmNlPSIxMCIKICAgICBvYmplY3R0b2xlcmFuY2U9IjEwIgogICAgIGJvcmRlcm9wYWNpdHk9IjEiCiAgICAgYm9yZGVyY29sb3I9IiM2NjY2NjYiCiAgICAgcGFnZWNvbG9yPSIjZmZmZmZmIiAvPgogIDxwYXRoCiAgICAgc3R5bGU9ImZpbGw6I2ZmZmZmZiIKICAgICBpZD0icGF0aDIiCiAgICAgZD0iTTEzLjQxOCA3Ljg1OWEuNjk1LjY5NSAwIDAxLjk3OCAwIC42OC42OCAwIDAxMCAuOTY5bC0zLjkwOCAzLjgzYS42OTcuNjk3IDAgMDEtLjk3OSAwbC0zLjkwOC0zLjgzYS42OC42OCAwIDAxMC0uOTY5LjY5NS42OTUgMCAwMS45NzggMEwxMCAxMWwzLjQxOC0zLjE0MXoiIC8+Cjwvc3ZnPgo=) right 10px center/20px no-repeat #1c1c21;
      border: 2px solid #41444e;
  }

  .dark-ui #swagger-ui select[multiple] { background: #212121; }

  .dark-ui #swagger-ui button.invalid, .dark-ui #swagger-ui input[type=email].invalid, .dark-ui #swagger-ui input[type=file].invalid, .dark-ui #swagger-ui input[type=password].invalid, .dark-ui #swagger-ui input[type=search].invalid, .dark-ui #swagger-ui input[type=text].invalid, .dark-ui #swagger-ui select.invalid, .dark-ui #swagger-ui textarea.invalid {
      background: #390e0e;
      border-color: #c83232;
  }

  .dark-ui #swagger-ui input[type=email], .dark-ui #swagger-ui input[type=file], .dark-ui #swagger-ui input[type=password], .dark-ui #swagger-ui input[type=search], .dark-ui #swagger-ui input[type=text], .dark-ui #swagger-ui textarea {
      background: #1c1c21;
      border: 1px solid #404040;
  }

  .dark-ui #swagger-ui textarea {
      background: rgba(28, 28, 33, .8);
      color: #b5bac9;
  }

  .dark-ui #swagger-ui input[disabled], .dark-ui #swagger-ui select[disabled] {
      background-color: #1f1f1f;
      color: #bfbfbf;
  }

  .dark-ui #swagger-ui textarea[disabled] {
      background-color: #41444e;
      color: #fff;
  }

  .dark-ui #swagger-ui select[disabled] { border-color: #878787; }

  .dark-ui #swagger-ui textarea:focus { border: 2px solid #2a69a7; }

  .dark-ui #swagger-ui .checkbox input[type=checkbox] + label > .item {
      background: #303030;
      box-shadow: #303030 0 0 0 2px;
  }

  .dark-ui #swagger-ui .checkbox input[type=checkbox]:checked + label > .item { background: url("data:image/svg+xml;charset=utf-8,<svg width=\"10\" height=\"8\" viewBox=\"3 7 10 8\" xmlns=\"http://www.w3.org/2000/svg\"><path fill=\"%2341474E\" fill-rule=\"evenodd\" d=\"M6.333 15L3 11.667l1.333-1.334 2 2L11.667 7 13 8.333z\"/></svg>") 50% center no-repeat #303030; }

  .dark-ui #swagger-ui .dialog-ux .backdrop-ux { background: rgba(0, 0, 0, .8); }

  .dark-ui #swagger-ui .dialog-ux .modal-ux {
      background: #1c1c21;
      border: 1px solid #2e2e2e;
      box-shadow: rgba(0, 0, 0, .2) 0 10px 30px 0;
  }

  .dark-ui #swagger-ui .dialog-ux .modal-ux-header .close-modal { background: 0 0; }

  .dark-ui #swagger-ui .model .deprecated span, .dark-ui #swagger-ui .model .deprecated td { color: #bfbfbf !important; }

  .dark-ui #swagger-ui .model-toggle::after { background: url("data:image/svg+xml;charset=utf-8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\"><path d=\"M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z\"/></svg>") 50% center/100% no-repeat; }

  .dark-ui #swagger-ui .model-hint {
      background: rgba(0, 0, 0, .7);
      color: #ebebeb;
  }

  .dark-ui #swagger-ui section.models { border: 1px solid rgba(58, 64, 80, .3); }

  .dark-ui #swagger-ui section.models.is-open h4 { border-bottom: 1px solid rgba(58, 64, 80, .3); }

  .dark-ui #swagger-ui section.models .model-container { background: rgba(0, 0, 0, .05); }

  .dark-ui #swagger-ui section.models .model-container:hover { background: rgba(0, 0, 0, .07); }

  .dark-ui #swagger-ui .model-box { background: rgba(0, 0, 0, .1); }

  .dark-ui #swagger-ui .prop-type { color: #aaaad4; }

  .dark-ui #swagger-ui table thead tr td, .dark-ui #swagger-ui table thead tr th {
      border-bottom: 1px solid rgba(58, 64, 80, .2);
      color: #b5bac9;
  }

  .dark-ui #swagger-ui .parameter__name.required::after { color: rgba(230, 153, 153, .6); }

  .dark-ui #swagger-ui .topbar .download-url-wrapper .select-label { color: #f0f0f0; }

  .dark-ui #swagger-ui .topbar .download-url-wrapper .download-url-button {
      background: #63a040;
      color: #fff;
  }

  .dark-ui #swagger-ui .info .title small { background: #7c8492; }

  .dark-ui #swagger-ui .info .title small.version-stamp { background-color: #7a9b27; }

  .dark-ui #swagger-ui .auth-container .errors {
      background-color: #350d0d;
      color: #b5bac9;
  }

  .dark-ui #swagger-ui .errors-wrapper {
      background: rgba(200, 50, 50, .1);
      border: 2px solid #c83232;
  }

  .dark-ui #swagger-ui .markdown code, .dark-ui #swagger-ui .renderedmarkdown code {
      background: rgba(0, 0, 0, .05);
      color: #c299e6;
  }

  .dark-ui #swagger-ui .model-toggle:after { background: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcKICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIgogICB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM6c29kaXBvZGk9Imh0dHA6Ly9zb2RpcG9kaS5zb3VyY2Vmb3JnZS5uZXQvRFREL3NvZGlwb2RpLTAuZHRkIgogICB4bWxuczppbmtzY2FwZT0iaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvbmFtZXNwYWNlcy9pbmtzY2FwZSIKICAgaW5rc2NhcGU6dmVyc2lvbj0iMS4wICg0MDM1YTRmYjQ5LCAyMDIwLTA1LTAxKSIKICAgc29kaXBvZGk6ZG9jbmFtZT0iZG93bmxvYWQyLnN2ZyIKICAgaWQ9InN2ZzQiCiAgIHZlcnNpb249IjEuMSIKICAgaGVpZ2h0PSIyNCIKICAgd2lkdGg9IjI0Ij4KICA8bWV0YWRhdGEKICAgICBpZD0ibWV0YWRhdGExMCI+CiAgICA8cmRmOlJERj4KICAgICAgPGNjOldvcmsKICAgICAgICAgcmRmOmFib3V0PSIiPgogICAgICAgIDxkYzpmb3JtYXQ+aW1hZ2Uvc3ZnK3htbDwvZGM6Zm9ybWF0PgogICAgICAgIDxkYzp0eXBlCiAgICAgICAgICAgcmRmOnJlc291cmNlPSJodHRwOi8vcHVybC5vcmcvZGMvZGNtaXR5cGUvU3RpbGxJbWFnZSIgLz4KICAgICAgPC9jYzpXb3JrPgogICAgPC9yZGY6UkRGPgogIDwvbWV0YWRhdGE+CiAgPGRlZnMKICAgICBpZD0iZGVmczgiIC8+CiAgPHNvZGlwb2RpOm5hbWVkdmlldwogICAgIGlua3NjYXBlOmN1cnJlbnQtbGF5ZXI9InN2ZzQiCiAgICAgaW5rc2NhcGU6d2luZG93LW1heGltaXplZD0iMSIKICAgICBpbmtzY2FwZTp3aW5kb3cteT0iLTkiCiAgICAgaW5rc2NhcGU6d2luZG93LXg9Ii05IgogICAgIGlua3NjYXBlOmN5PSIxMiIKICAgICBpbmtzY2FwZTpjeD0iMTIiCiAgICAgaW5rc2NhcGU6em9vbT0iMzQuNTgzMzMzIgogICAgIHNob3dncmlkPSJmYWxzZSIKICAgICBpZD0ibmFtZWR2aWV3NiIKICAgICBpbmtzY2FwZTp3aW5kb3ctaGVpZ2h0PSIxMDAxIgogICAgIGlua3NjYXBlOndpbmRvdy13aWR0aD0iMTkyMCIKICAgICBpbmtzY2FwZTpwYWdlc2hhZG93PSIyIgogICAgIGlua3NjYXBlOnBhZ2VvcGFjaXR5PSIwIgogICAgIGd1aWRldG9sZXJhbmNlPSIxMCIKICAgICBncmlkdG9sZXJhbmNlPSIxMCIKICAgICBvYmplY3R0b2xlcmFuY2U9IjEwIgogICAgIGJvcmRlcm9wYWNpdHk9IjEiCiAgICAgYm9yZGVyY29sb3I9IiM2NjY2NjYiCiAgICAgcGFnZWNvbG9yPSIjZmZmZmZmIiAvPgogIDxwYXRoCiAgICAgc3R5bGU9ImZpbGw6I2ZmZmZmZiIKICAgICBpZD0icGF0aDIiCiAgICAgZD0iTTEwIDZMOC41OSA3LjQxIDEzLjE3IDEybC00LjU4IDQuNTlMMTAgMThsNi02eiIgLz4KPC9zdmc+Cg==) 50% no-repeat; }

  .dark-ui #swagger-ui .expand-operation svg, .dark-ui #swagger-ui section.models h4 svg { fill: #fff; }

  .dark-ui ::-webkit-scrollbar-track { background-color: #646464 !important; }

  .dark-ui ::-webkit-scrollbar-thumb {
      background-color: #242424 !important;
      border: 2px solid #3e4346 !important;
  }

  .dark-ui ::-webkit-scrollbar-button:vertical:start:decrement {
      background: linear-gradient(130deg, #696969 40%, rgba(255, 0, 0, 0) 41%), linear-gradient(230deg, #696969 40%, transparent 41%), linear-gradient(0deg, #696969 40%, transparent 31%);
      background-color: #b6b6b6;
  }

  .dark-ui ::-webkit-scrollbar-button:vertical:end:increment {
      background: linear-gradient(310deg, #696969 40%, transparent 41%), linear-gradient(50deg, #696969 40%, transparent 41%), linear-gradient(180deg, #696969 40%, transparent 31%);
      background-color: #b6b6b6;
  }

  .dark-ui ::-webkit-scrollbar-button:horizontal:end:increment {
      background: linear-gradient(210deg, #696969 40%, transparent 41%), linear-gradient(330deg, #696969 40%, transparent 41%), linear-gradient(90deg, #696969 30%, transparent 31%);
      background-color: #b6b6b6;
  }

  .dark-ui ::-webkit-scrollbar-button:horizontal:start:decrement {
      background: linear-gradient(30deg, #696969 40%, transparent 41%), linear-gradient(150deg, #696969 40%, transparent 41%), linear-gradient(270deg, #696969 30%, transparent 31%);
      background-color: #b6b6b6;
  }

  .dark-ui ::-webkit-scrollbar-button, ::-webkit-scrollbar-track-piece { background-color: #3e4346 !important; }

  .dark-ui #swagger-ui .black, .dark-ui #swagger-ui .checkbox, .dark-ui #swagger-ui .dark-gray, .dark-ui #swagger-ui .download-url-wrapper .loading, .dark-ui #swagger-ui .errors-wrapper .errors small, .dark-ui #swagger-ui .fallback, .dark-ui #swagger-ui .filter .loading, .dark-ui #swagger-ui .gray, .dark-ui #swagger-ui .hover-black:focus, .dark-ui #swagger-ui .hover-black:hover, .dark-ui #swagger-ui .hover-dark-gray:focus, .dark-ui #swagger-ui .hover-dark-gray:hover, .dark-ui #swagger-ui .hover-gray:focus, .dark-ui #swagger-ui .hover-gray:hover, .dark-ui #swagger-ui .hover-light-silver:focus, .dark-ui #swagger-ui .hover-light-silver:hover, .dark-ui #swagger-ui .hover-mid-gray:focus, .dark-ui #swagger-ui .hover-mid-gray:hover, .dark-ui #swagger-ui .hover-near-black:focus, .dark-ui #swagger-ui .hover-near-black:hover, .dark-ui #swagger-ui .hover-silver:focus, .dark-ui #swagger-ui .hover-silver:hover, .dark-ui #swagger-ui .light-silver, .dark-ui #swagger-ui .markdown pre, .dark-ui #swagger-ui .mid-gray, .dark-ui #swagger-ui .model .property, .dark-ui #swagger-ui .model .property.primitive, .dark-ui #swagger-ui .model-title, .dark-ui #swagger-ui .near-black, .dark-ui #swagger-ui .parameter__extension, .dark-ui #swagger-ui .parameter__in, .dark-ui #swagger-ui .prop-format, .dark-ui #swagger-ui .renderedmarkdown pre, .dark-ui #swagger-ui .response-col_links .response-undocumented, .dark-ui #swagger-ui .response-col_status .response-undocumented, .dark-ui #swagger-ui .silver, .dark-ui #swagger-ui section.models h4, .dark-ui #swagger-ui section.models h5, .dark-ui #swagger-ui span.token-not-formatted, .dark-ui #swagger-ui span.token-string, .dark-ui #swagger-ui table.headers .header-example, .dark-ui #swagger-ui table.model tr.description, .dark-ui #swagger-ui table.model tr.extension { color: #bfbfbf; }

  .dark-ui #swagger-ui .hover-white:focus, .dark-ui #swagger-ui .hover-white:hover, .dark-ui #swagger-ui .info .title small pre, .dark-ui #swagger-ui .topbar a, .dark-ui #swagger-ui .white { color: #fff; }

  .dark-ui #swagger-ui .bg-black-10, .dark-ui #swagger-ui .hover-bg-black-10:focus, .dark-ui #swagger-ui .hover-bg-black-10:hover, .dark-ui #swagger-ui .stripe-dark:nth-child(2n + 1) { background-color: rgba(0, 0, 0, .1); }

  .dark-ui #swagger-ui .bg-white-10, .dark-ui #swagger-ui .hover-bg-white-10:focus, .dark-ui #swagger-ui .hover-bg-white-10:hover, .dark-ui #swagger-ui .stripe-light:nth-child(2n + 1) { background-color: rgba(28, 28, 33, .1); }

  .dark-ui #swagger-ui .bg-light-silver, .dark-ui #swagger-ui .hover-bg-light-silver:focus, .dark-ui #swagger-ui .hover-bg-light-silver:hover, .dark-ui #swagger-ui .striped--light-silver:nth-child(2n + 1) { background-color: #6e6e6e; }

  .dark-ui #swagger-ui .bg-moon-gray, .dark-ui #swagger-ui .hover-bg-moon-gray:focus, .dark-ui #swagger-ui .hover-bg-moon-gray:hover, .dark-ui #swagger-ui .striped--moon-gray:nth-child(2n + 1) { background-color: #4d4d4d; }

  .dark-ui #swagger-ui .bg-light-gray, .dark-ui #swagger-ui .hover-bg-light-gray:focus, .dark-ui #swagger-ui .hover-bg-light-gray:hover, .dark-ui #swagger-ui .striped--light-gray:nth-child(2n + 1) { background-color: #2b2b2b; }

  .dark-ui #swagger-ui .bg-near-white, .dark-ui #swagger-ui .hover-bg-near-white:focus, .dark-ui #swagger-ui .hover-bg-near-white:hover, .dark-ui #swagger-ui .striped--near-white:nth-child(2n + 1) { background-color: #242424; }

  .dark-ui #swagger-ui .opblock-tag:hover, .dark-ui #swagger-ui section.models h4:hover { background: rgba(0, 0, 0, .02); }

  .dark-ui #swagger-ui .checkbox p, .dark-ui #swagger-ui .dialog-ux .modal-ux-content h4, .dark-ui #swagger-ui .dialog-ux .modal-ux-content p, .dark-ui #swagger-ui .dialog-ux .modal-ux-header h3, .dark-ui #swagger-ui .errors-wrapper .errors h4, .dark-ui #swagger-ui .errors-wrapper hgroup h4, .dark-ui #swagger-ui .info .base-url, .dark-ui #swagger-ui .info .title, .dark-ui #swagger-ui .info h1, .dark-ui #swagger-ui .info h2, .dark-ui #swagger-ui .info h3, .dark-ui #swagger-ui .info h4, .dark-ui #swagger-ui .info h5, .dark-ui #swagger-ui .info li, .dark-ui #swagger-ui .info p, .dark-ui #swagger-ui .info table, .dark-ui #swagger-ui .loading-container .loading::after, .dark-ui #swagger-ui .model, .dark-ui #swagger-ui .opblock .opblock-section-header h4, .dark-ui #swagger-ui .opblock .opblock-section-header > label, .dark-ui #swagger-ui .opblock .opblock-summary-description, .dark-ui #swagger-ui .opblock .opblock-summary-operation-id, .dark-ui #swagger-ui .opblock .opblock-summary-path, .dark-ui #swagger-ui .opblock .opblock-summary-path__deprecated, .dark-ui #swagger-ui .opblock-description-wrapper, .dark-ui #swagger-ui .opblock-description-wrapper h4, .dark-ui #swagger-ui .opblock-description-wrapper p, .dark-ui #swagger-ui .opblock-external-docs-wrapper, .dark-ui #swagger-ui .opblock-external-docs-wrapper h4, .dark-ui #swagger-ui .opblock-external-docs-wrapper p, .dark-ui #swagger-ui .opblock-tag small, .dark-ui #swagger-ui .opblock-title_normal, .dark-ui #swagger-ui .opblock-title_normal h4, .dark-ui #swagger-ui .opblock-title_normal p, .dark-ui #swagger-ui .parameter__name, .dark-ui #swagger-ui .parameter__type, .dark-ui #swagger-ui .response-col_links, .dark-ui #swagger-ui .response-col_status, .dark-ui #swagger-ui .responses-inner h4, .dark-ui #swagger-ui .responses-inner h5, .dark-ui #swagger-ui .scheme-container .schemes > label, .dark-ui #swagger-ui .scopes h2, .dark-ui #swagger-ui .servers > label, .dark-ui #swagger-ui .tab li, .dark-ui #swagger-ui label, .dark-ui #swagger-ui select, .dark-ui #swagger-ui table.headers td { color: #b5bac9; }

  .dark-ui #swagger-ui .download-url-wrapper .failed, .dark-ui #swagger-ui .filter .failed, .dark-ui #swagger-ui .model-deprecated-warning, .dark-ui #swagger-ui .parameter__deprecated, .dark-ui #swagger-ui .parameter__name.required span, .dark-ui #swagger-ui table.model tr.property-row .star { color: #e69999; }

  .dark-ui #swagger-ui .opblock-body pre.microlight, .dark-ui #swagger-ui textarea.curl {
      background: #41444e;
      border-radius: 4px;
      color: #fff;
  }

  .dark-ui #swagger-ui .expand-methods svg, .dark-ui #swagger-ui .expand-methods:hover svg { fill: #bfbfbf; }

  .dark-ui #swagger-ui .auth-container, .dark-ui #swagger-ui .dialog-ux .modal-ux-header { border-bottom: 1px solid #2e2e2e; }

  .dark-ui #swagger-ui .topbar .download-url-wrapper .select-label select, .dark-ui #swagger-ui .topbar .download-url-wrapper input[type=text] { border: 2px solid #63a040; }

  .dark-ui #swagger-ui .info a, .dark-ui #swagger-ui .info a:hover, .dark-ui #swagger-ui .scopes h2 a { color: #99bde6; }

  /* Dark Scrollbar */
  .dark-ui ::-webkit-scrollbar {
      width: 14px;
      height: 14px;
  }

  .dark-ui ::-webkit-scrollbar-button {
      background-color: #3e4346 !important;
  }

  .dark-ui ::-webkit-scrollbar-track {
      background-color: #646464 !important;
  }

  .dark-ui ::-webkit-scrollbar-track-piece {
      background-color: #3e4346 !important;
  }

  .dark-ui ::-webkit-scrollbar-thumb {
      height: 50px;
      background-color: #242424 !important;
      border: 2px solid #3e4346 !important;
  }

  .dark-ui ::-webkit-scrollbar-corner {}

  .dark-ui ::-webkit-resizer {}

  .dark-ui ::-webkit-scrollbar-button:vertical:start:decrement {
      background:
      linear-gradient(130deg, #696969 40%, rgba(255, 0, 0, 0) 41%),
      linear-gradient(230deg, #696969 40%, rgba(0, 0, 0, 0) 41%),
      linear-gradient(0deg, #696969 40%, rgba(0, 0, 0, 0) 31%);
      background-color: #b6b6b6;
  }

  .dark-ui ::-webkit-scrollbar-button:vertical:end:increment {
      background:
      linear-gradient(310deg, #696969 40%, rgba(0, 0, 0, 0) 41%),
      linear-gradient(50deg, #696969 40%, rgba(0, 0, 0, 0) 41%),
      linear-gradient(180deg, #696969 40%, rgba(0, 0, 0, 0) 31%);
      background-color: #b6b6b6;
  }

  .dark-ui ::-webkit-scrollbar-button:horizontal:end:increment {
      background:
      linear-gradient(210deg, #696969 40%, rgba(0, 0, 0, 0) 41%),
      linear-gradient(330deg, #696969 40%, rgba(0, 0, 0, 0) 41%),
      linear-gradient(90deg, #696969 30%, rgba(0, 0, 0, 0) 31%);
      background-color: #b6b6b6;
  }

  .dark-ui ::-webkit-scrollbar-button:horizontal:start:decrement {
      background:
      linear-gradient(30deg, #696969 40%, rgba(0, 0, 0, 0) 41%),
      linear-gradient(150deg, #696969 40%, rgba(0, 0, 0, 0) 41%),
      linear-gradient(270deg, #696969 30%, rgba(0, 0, 0, 0) 31%);
      background-color: #b6b6b6;
  }

  .dark-ui .copy-btn {
    background-color: transparent !important;
    background-image: url(https://img.icons8.com/external-tal-revivo-color-tal-revivo/48/external-redux-an-open-source-javascript-library-for-managing-application-state-logo-color-tal-revivo.png);
  }

  .copy-btn {
    background-size: cover;
    background-color: transparent !important;
    background-image: url(https://img.icons8.com/external-tal-revivo-color-tal-revivo/48/external-redux-an-open-source-javascript-library-for-managing-application-state-logo-color-tal-revivo.png);
    height: 20px;
    width: 20px;
    border: none;
    margin-left: 0.5rem;
  }
`;
