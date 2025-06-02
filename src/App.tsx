"use client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {Toaster} from "@/components/ui/sonner";
import {type AnyDocumentId, useDocument} from "@automerge/react";

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

function App({docUrl}: { docUrl?: AnyDocumentId }) {
    const [doc, changeDoc] = useDocument<ToastList>(docUrl);

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
                                label: "Read",
                                onClickMessage: "Opened toast #"+n.getTime(),
                            }
                        }
                        changeDoc((draft) => {
                            draft.toasts.push(newToast);
                        })
                        toast(newToast.title, {
                            description: newToast.description,
                            action: {
                                label: newToast.action?.label,
                                onClick: () => {
                                    console.log(newToast.action?.onClickMessage);
                                }
                            },
                            duration: 5000,
                        })
                    }
                }
            >
                Show Toast
            </Button>
            <Toaster />
            <div className="mt-4">
                {doc?.toasts.map((toast) => (
                    <div key={toast.id} className="p-2 border rounded mb-2">
                        <h3 className="font-bold">{toast.title}</h3>
                        <p>{toast.description}</p>
                    </div>
                ))}
            </div>
        </>
    )
}

export default App
