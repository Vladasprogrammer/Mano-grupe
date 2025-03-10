import './buttons.scss';
import './crud.scss';
import Create from './Components/crud/Create';
import { useRef, useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import * as C from './Components/crud/constants';
import List from './Components/crud/List';
import { v4 as uuid4 } from 'uuid';
import Edit from './Components/crud/Edit';
import Delete from './Components/crud/Delete';
import Messages from './Components/crud/Messages';

export default function App() {

    // const [refreshTime, setRefreshTime] = useState(Date.now()); // timestamp

    const pageLoaded = useRef(false);
    const sortRow = useRef(0);

    const [planets, setPlanets] = useState(null);

    const [createData, setCreateData] = useState(null);
    const [storeData, setStoreData] = useState(null);
    const [editData, setEditData] = useState(null);
    const [updateData, setUpdateData] = useState(null);
    const [deleteData, setDeleteData] = useState(null);
    const [destroyData, setDestroyData] = useState(null);
    const [messages, setMessages] = useState([]);

    const [sort, setSort] = useState(0);

    const addMessage = useCallback(msg => {
        const id = uuid4();

        const stId = setTimeout(_ => {
            setMessages(m => m.filter(msg => msg.id !== id));
        }, 5000);

        setMessages(m => [...m, { ...msg, id, stId }]);

        return id;
    }, []);

    const updateMessage = useCallback((msg, id) => {
        setMessages(m => {
            let updated = false;
            const M = m.map(message => {
                if (message.id === id) {
                    updated = true;
                    clearTimeout(message.stId);
                    setTimeout(_ => {
                        setMessages(m => m.filter(msg => msg.id !== id));
                    }, 5000);
                    return { ...msg, id };
                }
                return message;
            });
            if (!updated) {
                setTimeout(_ => {
                    setMessages(m => m.filter(msg => msg.id !== id));
                }, 5000);
                return [...M, { ...msg, id }];
            }
            return M;
        });
    }, [addMessage]);

    const removeMessage = id => {
        setMessages(m => m.filter(msg => msg.id !== id));
    };

    useEffect(_ => {
        if (!pageLoaded.current) {
            pageLoaded.current = true;
            return;
        }

        if (0 === sort) {
            setPlanets(p => p.toSorted((a, b) => a.row - b.row));
        } else if (1 === sort) {
            setPlanets(p => p.toSorted((a, b) => a.size - b.size));
        } else {
            setPlanets(p => p.toSorted((a, b) => b.size - a.size));
        }
    }, [sort, pageLoaded]);

    useEffect(_ => {
        axios.get(C.serverUrl)
            .then(res => {
                setPlanets(res.data.map((p, i) => ({ ...p, row: i})));
            })
            .catch(error => {
                console.error(error);
            });
    }, []);


    useEffect(_ => {
        if (null === storeData) {
            return;
        }
        const id = uuid4();
        setPlanets(p => [{ ...storeData, id, temp: true, row: --sortRow.current }, ...p]);

        const msgId = addMessage({
            type: 'info',
            title: 'Planeta kuriasi...',
            text: `Planeta ${storeData.name} skrenda į atvirą kosmosą...`
        });

        axios.post(C.serverUrl, storeData)
            .then(res => {
                if (res.data.success) {
                    setPlanets(p => p.map(planet => {
                        if (planet.id === id) {
                            delete planet.temp;
                            planet.id = res.data.id;
                        }
                        return planet;
                    }));
                    updateMessage(res.data.message, msgId);
                }
            })
            .catch(error => {
                console.error(error);
                setCreateData(storeData);
                setPlanets(p => p.filter(planet => planet.id !== id));
            });

    }, [storeData, addMessage, updateMessage]);


    useEffect(_ => {
        if (null === updateData) {
            return;
        }
        const id = updateData.id;
        delete updateData.id;

        const msgId = addMessage({
            type: 'info',
            title: 'Planeta atnaujinama...',
            text: `Planeta ${updateData.name} atnaujinama...`
        });

        setPlanets(p => p.map(planet => {
            if (planet.id === id) {
                return { ...planet, ...updateData, temp: true, copy: { ...planet } };
            }
            return planet;
        }));

        axios.put(C.serverUrl + id, { ...updateData })
            .then(res => {
                if (res.data.success) {
                    setPlanets(p => p.map(planet => {
                        if (planet.id === id) {
                            delete planet.temp;
                            delete planet.copy;
                        }
                        return planet;
                    }));
                    updateMessage(res.data.message, msgId);
                }
            })
            .catch(error => {
                console.error(error);
                setPlanets(p => p.map(planet => {
                    if (planet.id === id) {

                        return { ...planet.copy };
                    }
                    return planet;
                }
                ));
                setEditData({ ...updateData, id });
            });

    }, [updateData, addMessage, updateMessage]);


    useEffect(_ => {
        if (null === destroyData) {
            return;
        }
        const id = destroyData.id;

        setDeleteData(null);

        const msgId = addMessage({
            type: 'info',
            title: 'Planeta sunaikinama...',
            text: `Planeta ${destroyData.name} sunaikinama...`
        });

        setPlanets(p => p.map(planet => {
            if (planet.id === id) {
                return { ...planet, temp: true };
            }
            return planet;
        }));

        axios.delete(C.serverUrl + id)
            .then(res => {
                if (res.data.success) {
                    setPlanets(p => p.filter(planet => planet.id !== id));
                    updateMessage(res.data.message, msgId);
                }
            })
            .catch(error => {
                console.error(error);

                setPlanets(p => p.map(planet => {
                    if (planet.id === id) {
                        delete planet.temp;
                    }
                    return planet;
                }));

            });

    }, [destroyData, addMessage, updateMessage]);

    return (
        <>
            <div className="container">
                <div className="row">
                    <div className="col-4">
                        <Create setStoreData={setStoreData} createData={createData} />
                    </div>
                    <div className="col-8">
                        <List sort={sort} setSort={setSort} planets={planets} setEditData={setEditData} setDeleteData={setDeleteData} />
                    </div>
                </div>
            </div>
            {editData !== null && <Edit setEditData={setEditData} editData={editData} setUpdateData={setUpdateData} />}
            {deleteData !== null && <Delete setDeleteData={setDeleteData} deleteData={deleteData} setDestroyData={setDestroyData} />}
            <Messages messages={messages} removeMessage={removeMessage} />
        </>
    );
}