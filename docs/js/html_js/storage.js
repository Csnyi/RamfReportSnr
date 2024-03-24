/** localStorage */

    /* Metthod for add storage  */
    let addDataLs = (element, lsname) => {
        if(element != ''){
            setData(element, lsname); // handler for adding item into local storage
        }
    }
 
     /* handler for get storage  */
    let getData = (lsname, item = null) => {
        /*
        * localStorage.getItem(<itemname>) main method 
        * (predefined method of js) for getting item from localstorage
        */
        let data = JSON.parse(localStorage.getItem(lsname)); 
        if(data){

            if(item) {
                if(data.indexOf(item) != -1){
                    return data[item];
                }else{
                    return false;
                }
            }
            return data;
        }
        return false;
    }

     /* handler for set data/item storage  */
    let setData = (item, lsname) => {
        let data = getData(lsname); // call getdata handler for getting  data from list 
        data = (data != false) ? data : [];
        data.push(item);
        data = JSON.stringify(data);
        /*
        * localStorage.setItem(<itemname>,<itemvalue>) main method 
        * (predefined method of js) for set item into localstorage
        */
        localStorage.setItem(lsname, data);
        
    }

/** indexedDB */

    let db; // global variable to store the database reference

    // Initialize the database
    const initDB = () => {
        return new Promise((resolve, reject) => {
            let request = window.indexedDB.open('my_database', 1);
    
            request.onerror = function(event) {
                reject('Error initializing the database!');
            };
    
            request.onsuccess = function(event) {
                db = event.target.result;
                resolve();
            };
    
            request.onupgradeneeded = function(event) {
                let db = event.target.result;
                let objectStore = db.createObjectStore('my_store', { keyPath: 'id', autoIncrement: true });
                objectStore.createIndex('data', 'data', { unique: false });
            };
        });
    }
    
    // Method to add data to IndexedDB
    let addDataIndexedDB = async (element) => {
        if(element != ''){
            await initDB(); // Ensures that the database is initialized
            let transaction = db.transaction(['my_store'], 'readwrite');
            let objectStore = transaction.objectStore('my_store');
            objectStore.add({ data: element });
        }
    }
    
    // A method to query data from IndexedDB
    let getDataIndexedDB = async () => {
        await initDB(); // Ensures that the database is initialized
        return new Promise((resolve, reject) => {
            let transaction = db.transaction(['my_store'], 'readonly');
            let objectStore = transaction.objectStore('my_store');
            let request = objectStore.getAll();
    
            request.onerror = function(event) {
                reject('Error when querying the data!');
            };
    
            request.onsuccess = function(event) {
                resolve(request.result.map(item => item.data));
            };
        });
    }
    
    // Method to store data in IndexedDB
    let setDataIndexedDB = async (item) => {
        await initDB(); // Ensures that the database is initialized
        let transaction = db.transaction(['my_store'], 'readwrite');
        let objectStore = transaction.objectStore('my_store');
        let request = objectStore.getAll();
    
        request.onerror = function(event) {
            console.log('Error when querying the data!');
        };
    
        request.onsuccess = function(event) {
            let data = request.result.map(item => item.data);
            data.push(item);
            objectStore.put({ data: data });
        };
    }
    
/** IndexDB data query */

    let responseData; // Create a global variable to store the data

    // A method to query data from IndexedDB
    let getAllDataIndexedDB = async () => {
        await initDB(); // Ensures that the database is initialized
        return new Promise((resolve, reject) => {
            let transaction = db.transaction(['my_store'], 'readonly');
            let objectStore = transaction.objectStore('my_store');
            let request = objectStore.getAll();

            request.onerror = function(event) {
                reject('Error when querying the data!');
            };

            request.onsuccess = function(event) {
                resolve(request.result.map(item => item.data));
            };
        });
    }

    // A method to delete the contents of a data store in IndexedDB
    let clearIDB = async () => {
        await initDB(); // Ensures that the database is initialized
        return new Promise((resolve, reject) => {
            let transaction = db.transaction(['my_store'], 'readwrite');
            let objectStore = transaction.objectStore('my_store');
            let request = objectStore.clear();

            request.onerror = function(event) {
                reject('Error deleting the contents of the data store!');
            };

            request.onsuccess = function(event) {
                resolve('The content of the data storage has been successfully deleted!');
            };
        });
    }


