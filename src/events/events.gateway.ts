import { WebSocketGateway, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect, WsResponse, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

                     

@WebSocketGateway({
  cors: {
    origin: '*',
  }
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server; 

  // WebSocket connection lifecycle
  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
  }


@SubscribeMessage('startTTS')
async startTTS(client: Socket, { message }: { message: string }): Promise<WsResponse<any>> {
  try {
    // Get the audio stream from the OpenAI API
    const audioStream = await this.streamTextToSpeech(message);

    // Get a reader to read the stream
    const reader = audioStream.getReader();

    // Function to process the stream
    const processStream = async () => {
      let result;
      try {
        // Read the next chunk from the stream
        result = await reader.read();

        // If the stream is done, emit 'audio_end' and stop processing
        if (result.done) {
          console.log('Audio streaming complete.');
          client.emit('audio_end');
          return;
        }

        // Emit the chunk to the client
        // client.emit('audio_chunk', this.wrapPCMInWAV(result.value).buffer);
        client.emit('audio_chunk', result.value);
        // Continue reading the next chunk
        processStream();
      } catch (err) {
        console.error('Error during streaming:', err);
        client.emit('audio_error', 'An error occurred while streaming');
      }
    };

    // Start processing the stream
    processStream();

    return { event: 'startTTS', data: 'Streaming started' };
  } catch (error) {
    console.error('Error during TTS streaming:', error);
    client.emit('audio_chunk', 'Error occurred while streaming');
    return { event: 'startTTS', data: 'Error occurred while streaming' };
  }
}

private async streamTextToSpeech(message: string): Promise<ReadableStream<Uint8Array>> {
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      voice: 'alloy',
      input: message,
      response_format: 'opus',  // Ensure OpenAI is returning a supported format (opus or wav)
      stream: true,
    }),
  });

  // Check for a successful response
  if (!response.ok) {
    throw new Error(`Failed to fetch TTS: ${response.statusText}`);
  }

  // Return the response body as a readable stream
  return response.body;
}

private createWavHeader = (numFrames: number, numChannels = 1, sampleRate = 24000, bytesPerSample = 2) => {
  const dataSize = numFrames * numChannels * bytesPerSample;
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);

  const writeString = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) {
      view.setUint8(offset + i, text.charCodeAt(i));
    }
  };

  // Write WAV header
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true); // File size
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true);  // Audio format (1 = PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
  view.setUint16(32, numChannels * bytesPerSample, true);
  view.setUint16(34, bytesPerSample * 8, true); // Bits per sample
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  return buffer;
};

// private writeString = (view: DataView, offset: number, text: string) => {
//   for (let i = 0; i < text.length; i++) {
//     view.setUint8(offset + i, text.charCodeAt(i));
//   }
// };

private wrapPCMInWAV = (pcmArrayBuffer: ArrayBuffer, sampleRate = 24000) => {
  const numFrames = pcmArrayBuffer.byteLength / 2; // PCM16 has 2 bytes per sample
  const wavHeader = this.createWavHeader(numFrames, 1, sampleRate);
  return new Uint8Array([...new Uint8Array(wavHeader), ...new Uint8Array(pcmArrayBuffer)]);
};



  
}
