import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogCancel,
	AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onDelete: (userId: string) => void;
	user?: {
		id: string;
		username: string;
		email?: string;
	};
};

export function DeleteUserDialog({
	open,
	onOpenChange,
	onDelete,
	user,
}: Props) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent className="sm:max-w-md">
				<AlertDialogHeader>
					<div className="flex items-center gap-2">
						<div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
							<AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500" />
						</div>
						<AlertDialogTitle>Delete User Account</AlertDialogTitle>
					</div>
					<AlertDialogDescription className="space-y-2 pt-2">
						<p>
							Are you sure you want to delete{" "}
							<strong className="font-semibold text-foreground">
								{user?.username}
							</strong>
							{user?.email && (
								<span className="text-muted-foreground">
									{" "}
									({user.email})
								</span>
							)}
							?
						</p>
						<p className="text-red-600 dark:text-red-500 font-medium">
							This action cannot be undone. All user data and
							access permissions will be permanently removed from
							the system.
						</p>
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={() => user?.id && onDelete(user.id)}
						className="bg-red-600 hover:bg-red-700 focus:ring-red-600">
						Delete User
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
