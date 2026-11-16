import {loadFont} from '@remotion/google-fonts/Inter';
import {
	AbsoluteFill,
	Easing,
	Interactive,
	interpolate,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';

// Registers the "Inter" family and blocks rendering until it has loaded.
// The family name is then written inline as 'Inter' so Studio can edit it.
loadFont('normal', {
	weights: ['500', '800'],
	subsets: ['latin'],
});

// Title: fades up into place over the first 0.6 s.
const Title = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	return (
		<Interactive.Div
			name="Title"
			style={{
				fontFamily: 'Inter',
				fontWeight: 800,
				fontSize: 120,
				lineHeight: 1.05,
				letterSpacing: -2,
				color: '#FFFFFF',
				textAlign: 'center',
				opacity: interpolate(frame, [0, 0.5 * fps], [0, 1], {
					easing: Easing.bezier(0.16, 1, 0.3, 1),
					extrapolateLeft: 'clamp',
					extrapolateRight: 'clamp',
				}),
				translate: interpolate(frame, [0, 1 * fps], ['0px 80px', '0px -160px'], {
					easing: Easing.bezier(0.16, 1, 0.3, 1),
					extrapolateLeft: 'clamp',
					extrapolateRight: 'clamp',
				}),
				scale: interpolate(frame, [0, 0.6 * fps], [0.9, 1], {
					easing: Easing.bezier(0.16, 1, 0.3, 1),
					extrapolateLeft: 'clamp',
					extrapolateRight: 'clamp',
					output: 'perceptual-scale',
				}),
			}}
		>
			How It Scales
		</Interactive.Div>
	);
};

// Byline: follows once the title has mostly settled (0.7 s to 1.2 s).
const Byline = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	return (
		<Interactive.Div
			name="Byline"
			style={{
				fontFamily: 'Inter',
				fontWeight: 500,
				fontSize: 56,
				color: '#FFD60A',
				textAlign: 'center',
				opacity: interpolate(frame, [0.7 * fps, 1.2 * fps], [0, 1], {
					easing: Easing.bezier(0.16, 1, 0.3, 1),
					extrapolateLeft: 'clamp',
					extrapolateRight: 'clamp',
				}),
				translate: interpolate(
					frame,
					[0.7 * fps, 1.2 * fps],
					['0px 30px', '0px 0px'],
					{
						easing: Easing.spring({damping: 200}),
						extrapolateLeft: 'clamp',
						extrapolateRight: 'clamp',
					},
				),
			}}
		>
			by Curiously
		</Interactive.Div>
	);
};

export const TitleCard = () => {
	return (
		<AbsoluteFill
			style={{
				backgroundColor: '#0B0B0F',
				justifyContent: 'center',
				alignItems: 'center',
				flexDirection: 'column',
				gap: 36,
				padding: '100px 80px',
			}}
		>
			<Title />
			<Byline />
		</AbsoluteFill>
	);
};
