import { Loader } from "@googlemaps/js-api-loader";

const loader = new Loader({
    apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY!,
    version: "weekly",
    libraries: ["places"],
});

const loadGoogleMaps = async () => {
    try {
        await loader.load();
        console.log('Google Maps API loaded successfully');
    } catch (error) {
        console.error('Failed to load Google Maps API:', error);
        throw error;
    }
};
export default loadGoogleMaps;