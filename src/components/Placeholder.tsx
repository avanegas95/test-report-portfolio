interface PlaceholderProps {
  message: string;
}

export function Placeholder({ message }: PlaceholderProps) {
  return (
    <p className="font-mono text-sm text-neutral-400" data-testid="placeholder">
      {message}
    </p>
  );
}
