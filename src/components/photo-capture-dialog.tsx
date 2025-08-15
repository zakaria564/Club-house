
"use client"
import * as React from "react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Camera, Image as ImageIcon } from "lucide-react"

interface PhotoCaptureDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTakePhoto: () => void
  onChooseFromGallery: () => void
}

export function PhotoCaptureDialog({
  open,
  onOpenChange,
  onTakePhoto,
  onChooseFromGallery,
}: PhotoCaptureDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Changer la photo de profil</AlertDialogTitle>
          <AlertDialogDescription>
            Choisissez une source pour votre nouvelle photo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
          <Button variant="outline" className="h-24 flex-col gap-2" onClick={onTakePhoto}>
            <Camera className="h-8 w-8" />
            <span>Prendre une photo</span>
          </Button>
          <Button variant="outline" className="h-24 flex-col gap-2" onClick={onChooseFromGallery}>
            <ImageIcon className="h-8 w-8" />
            <span>Choisir de la galerie</span>
          </Button>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
