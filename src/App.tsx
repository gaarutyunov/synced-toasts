"use client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {Toaster} from "@/components/ui/sonner";
import {type AnyDocumentId, type DocHandleChangePayload, useDocHandle} from "@automerge/react";
import {useCallback, useEffect, useState} from "react";
import type {ChangeFn, ChangeOptions, Doc} from "@automerge/automerge";

export interface Toast {
    id: number | string;
    title?: string;
    description?: string;
    action?: {
        label: string;
        onClickMessage: string;
    };
}

export interface ToastList {
    toasts: Toast[];
}

export type UseDocumentReturn<T> = [
    Doc<T>,
    (changeFn: ChangeFn<T>, options?: ChangeOptions<T>) => void
]

interface UseDocumentSuspendingParams {
    suspense: true
}
interface UseDocumentSynchronousParams {
    suspense: false
}

type UseDocumentParams =
    | UseDocumentSuspendingParams
    | UseDocumentSynchronousParams

function useDocument<T>(
    id: AnyDocumentId | undefined,
    params: UseDocumentParams = { suspense: false },
    onChangeCallback: ((e: DocHandleChangePayload<T>) => void) | undefined = undefined
): UseDocumentReturn<T> | [undefined, () => void] {
    // @ts-expect-error -- typescript doesn't realize we're discriminating these types the same way in both functions
    const handle = useDocHandle<T>(id, params)
    // Initialize with current doc state
    const [doc, setDoc] = useState<Doc<T> | undefined>(() => handle?.doc())
    const [deleteError, setDeleteError] = useState<Error>()

    // Reinitialize doc when handle changes
    useEffect(() => {
        setDoc(handle?.doc())
    }, [handle])

    useEffect(() => {
        if (!handle) {
            return
        }
        const onChange = (e: DocHandleChangePayload<T>) => {
            const d = handle.doc()
            setDoc(d)
            if (onChangeCallback) {
                onChangeCallback(e)
            }
        }
        const onDelete = () => {
            setDeleteError(new Error(`Document ${id} was deleted`))
        }

        handle.on("change", onChange)
        handle.on("delete", onDelete)

        return () => {
            handle.removeListener("change", onChange)
            handle.removeListener("delete", onDelete)
        }
    }, [handle, id, onChangeCallback])

    const changeDoc = useCallback(
        (changeFn: ChangeFn<T>, options?: ChangeOptions<T>) => {
            handle!.change(changeFn, options)
        },
        [handle]
    )

    if (deleteError) {
        throw deleteError
    }

    if (!doc) {
        return [undefined, () => {}]
    }

    return [doc, changeDoc]
}

function showToast(t: Toast, close: () => void) {
    toast(t.title, {
        id: t.id,
        description: t.description,
        action: {
            label: t.action?.label,
            onClick: close,
        },
        duration: 5000,
    })
}

function App({docUrl}: { docUrl?: AnyDocumentId }) {
    const [, changeDoc] = useDocument<ToastList>(docUrl, { suspense: false }, (change) => {
        console.log(change)
        const insertA = change.patches.find(v => v.path[0] === "toasts" && v.action === "insert")
        const deleteA = change.patches.find(v => v.path[0] === "toasts" && v.action === "del")
        const closeAll = change.patches.find(v => v.path.length === 1 && v.path[0] === "toasts")
        if (insertA) {
            showToast(change.doc.toasts[Number(insertA.path[1])], () => {
                change.handle.change((toasts) => {
                    toasts.toasts.splice(Number(insertA.path[1]), 1)
                })
            })
        } else if (deleteA) {
            toast.dismiss(change.patchInfo.before.toasts[Number(deleteA.path[1])].id);
        } else if (closeAll) {
            toast.dismiss()
        }
    });

    return (
        <>
            <Button
                variant="outline"
                onClick={() =>
                    {
                        const n = new Date()
                        const newToast = {
                            id: n.getTime(),
                            title: "Event Created",
                            description: n.toDateString(),
                            action: {
                                label: "Close",
                                onClickMessage: "Opened toast #"+n.getTime(),
                            }
                        }
                        changeDoc((draft) => {
                            draft.toasts.push(newToast)
                        })
                    }
                }
            >
                Show Toast
            </Button>
            <Button variant="destructive" onClick={() => {
                changeDoc((draft) => {
                    draft.toasts = []
                })
            }}>Close All</Button>
            <Toaster />
        </>
    )
}

export default App
